import sql from "@/app/api/utils/sql";

function quoteIdent(identifier) {
  // Identifiers come from pg_catalog, not user input, but still quote safely.
  const str = String(identifier);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

async function runCheck(name, fn) {
  try {
    const details = await fn();
    return { name, passed: true, details: details ?? null };
  } catch (error) {
    return {
      name,
      passed: false,
      error: error?.message || String(error),
    };
  }
}

async function listTablesMissingPrimaryKey() {
  const rows = await sql`
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint con
        WHERE con.conrelid = c.oid
          AND con.contype = 'p'
      )
    ORDER BY c.relname;
  `;
  return rows.map((r) => r.table_name);
}

async function listNotValidatedConstraints() {
  const rows = await sql`
    SELECT
      con.conname AS constraint_name,
      con.contype AS constraint_type,
      rel.relname AS table_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE n.nspname = 'public'
      AND con.convalidated = false
    ORDER BY rel.relname, con.conname;
  `;

  const typeLabel = {
    p: "PRIMARY KEY",
    f: "FOREIGN KEY",
    u: "UNIQUE",
    c: "CHECK",
    t: "TRIGGER",
    x: "EXCLUSION",
  };

  return rows.map((r) => ({
    table: r.table_name,
    constraint: r.constraint_name,
    type: typeLabel[r.constraint_type] || r.constraint_type,
  }));
}

async function listForeignKeys() {
  const rows = await sql`
    SELECT
      con.oid AS constraint_oid,
      con.conname AS constraint_name,
      child_ns.nspname AS child_schema,
      child.relname AS child_table,
      parent_ns.nspname AS parent_schema,
      parent.relname AS parent_table,
      con.conkey AS child_attnums,
      con.confkey AS parent_attnums,
      con.confdeltype AS on_delete_action,
      con.confupdtype AS on_update_action,
      con.convalidated AS validated
    FROM pg_constraint con
    JOIN pg_class child ON child.oid = con.conrelid
    JOIN pg_namespace child_ns ON child_ns.oid = child.relnamespace
    JOIN pg_class parent ON parent.oid = con.confrelid
    JOIN pg_namespace parent_ns ON parent_ns.oid = parent.relnamespace
    WHERE con.contype = 'f'
      AND child_ns.nspname = 'public'
      AND parent_ns.nspname = 'public'
    ORDER BY child.relname, con.conname;
  `;
  return rows;
}

async function getColumnNamesForAttnums(tableName, attnums) {
  // attnums is int[] from postgres.
  const rows = await sql`
    SELECT attnum, attname
    FROM pg_attribute
    WHERE attrelid = ${tableName}::regclass
      AND attnum = ANY(${attnums});
  `;
  const byNum = new Map(rows.map((r) => [Number(r.attnum), r.attname]));
  return attnums.map((n) => byNum.get(Number(n)));
}

function decodeAction(actionChar) {
  // From pg_constraint docs: a=NO ACTION, r=RESTRICT, c=CASCADE, n=SET NULL, d=SET DEFAULT
  const map = {
    a: "NO ACTION",
    r: "RESTRICT",
    c: "CASCADE",
    n: "SET NULL",
    d: "SET DEFAULT",
  };
  return map[actionChar] || actionChar;
}

async function foreignKeyViolationCounts() {
  const fks = await listForeignKeys();
  const violations = [];

  // We'll check all FKs in public schema. This can be heavy on huge datasets,
  // but for most apps it's fine.
  for (const fk of fks) {
    const childRegclass = `${fk.child_schema}.${fk.child_table}`;
    const parentRegclass = `${fk.parent_schema}.${fk.parent_table}`;

    const childCols = await getColumnNamesForAttnums(
      childRegclass,
      fk.child_attnums,
    );
    const parentCols = await getColumnNamesForAttnums(
      parentRegclass,
      fk.parent_attnums,
    );

    if (childCols.some((c) => !c) || parentCols.some((c) => !c)) {
      // If we can't resolve columns, skip but report.
      violations.push({
        constraint: fk.constraint_name,
        child_table: fk.child_table,
        parent_table: fk.parent_table,
        bad_count: null,
        error: "Could not resolve FK column names",
      });
      // eslint-disable-next-line no-continue
      continue;
    }

    const joinConditions = childCols
      .map((childCol, idx) => {
        const parentCol = parentCols[idx];
        return `c.${quoteIdent(childCol)} IS NOT DISTINCT FROM p.${quoteIdent(parentCol)}`;
      })
      .join(" AND ");

    const notNullConditions = childCols
      .map((childCol) => `c.${quoteIdent(childCol)} IS NOT NULL`)
      .join(" AND ");

    // If FK columns are nullable, rows where ANY is null are not checked by Postgres.
    // So we only scan rows where ALL child key columns are non-null.
    const whereClause = notNullConditions
      ? `WHERE ${notNullConditions} AND p.${quoteIdent(parentCols[0])} IS NULL`
      : `WHERE p.${quoteIdent(parentCols[0])} IS NULL`;

    const query = `
      SELECT COUNT(*)::bigint AS bad_count
      FROM ${quoteIdent(fk.child_schema)}.${quoteIdent(fk.child_table)} c
      LEFT JOIN ${quoteIdent(fk.parent_schema)}.${quoteIdent(fk.parent_table)} p
        ON ${joinConditions}
      ${whereClause};
    `;

    const rows = await sql(query, []);
    const badCount = Number(rows?.[0]?.bad_count ?? 0);
    if (badCount > 0) {
      violations.push({
        constraint: fk.constraint_name,
        child_table: fk.child_table,
        parent_table: fk.parent_table,
        child_columns: childCols,
        parent_columns: parentCols,
        bad_count: badCount,
        on_delete: decodeAction(fk.on_delete_action),
        on_update: decodeAction(fk.on_update_action),
        validated: fk.validated,
      });
    }
  }

  return {
    total_fks: fks.length,
    violating_fks: violations.length,
    violations,
  };
}

async function foreignKeysMissingIndexes() {
  const fks = await listForeignKeys();

  const suggestions = [];

  // Only report single-column FKs (simple + actionable).
  for (const fk of fks) {
    if (!Array.isArray(fk.child_attnums) || fk.child_attnums.length !== 1) {
      continue;
    }

    const childRegclass = `${fk.child_schema}.${fk.child_table}`;
    const [childCol] = await getColumnNamesForAttnums(
      childRegclass,
      fk.child_attnums,
    );
    if (!childCol) {
      continue;
    }

    // Get *first column* for every index on this table (reliable; avoids int2vector parsing).
    const indexFirstCols = await sql`
      SELECT
        i.relname AS index_name,
        a.attname AS first_column
      FROM pg_index idx
      JOIN pg_class t ON t.oid = idx.indrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_class i ON i.oid = idx.indexrelid
      JOIN LATERAL unnest(idx.indkey) WITH ORDINALITY AS k(attnum, ord) ON true
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
      WHERE n.nspname = 'public'
        AND t.relname = ${fk.child_table}
        AND idx.indisvalid = true
        AND idx.indisready = true
        AND k.ord = 1;
    `;

    const hasIndex = indexFirstCols.some(
      (r) => String(r.first_column) === String(childCol),
    );

    if (!hasIndex) {
      suggestions.push({
        child_table: fk.child_table,
        child_column: childCol,
        constraint: fk.constraint_name,
        suggested_index_sql: `CREATE INDEX ON ${quoteIdent(fk.child_schema)}.${quoteIdent(fk.child_table)} (${quoteIdent(childCol)});`,
      });
    }
  }

  return {
    missing_index_count: suggestions.length,
    suggestions,
  };
}

async function softDeletePatternAudit() {
  // Find tables that *look* like they use is_deleted/deleted_at but lack a CHECK constraint.
  const tables = await sql`
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname;
  `;

  const offenders = [];

  for (const t of tables) {
    const cols = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${t.table_name};
    `;

    const colNames = new Set(cols.map((c) => c.column_name));
    const hasIsDeleted = colNames.has("is_deleted");
    const hasDeletedAt = colNames.has("deleted_at");

    if (!hasIsDeleted || !hasDeletedAt) {
      continue;
    }

    const checks = await sql`
      SELECT conname, pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conrelid = ${t.table_name}::regclass
        AND contype = 'c';
    `;

    // Heuristic: look for a check mentioning both is_deleted and deleted_at.
    const hasSoftDeleteCheck = checks.some((c) => {
      const def = String(c.def || "").toLowerCase();
      return def.includes("is_deleted") && def.includes("deleted_at");
    });

    if (!hasSoftDeleteCheck) {
      offenders.push({
        table: t.table_name,
        issue:
          "Has is_deleted + deleted_at but no CHECK constraint tying them together",
      });
    }
  }

  return {
    tables_with_issue: offenders.length,
    offenders,
  };
}

export async function GET() {
  const results = [];

  results.push(
    await runCheck("all tables have a primary key", async () => {
      const missing = await listTablesMissingPrimaryKey();
      if (missing.length > 0) {
        throw new Error(`Tables missing PK: ${missing.join(", ")}`);
      }
      return "All public tables have a primary key";
    }),
  );

  results.push(
    await runCheck("no NOT VALID constraints in public schema", async () => {
      const notValidated = await listNotValidatedConstraints();
      if (notValidated.length > 0) {
        const preview = notValidated
          .slice(0, 10)
          .map((c) => `${c.table}.${c.constraint} (${c.type})`)
          .join(", ");
        throw new Error(
          `Found ${notValidated.length} NOT VALID constraint(s): ${preview}${notValidated.length > 10 ? "…" : ""}`,
        );
      }
      return "All constraints are validated";
    }),
  );

  results.push(
    await runCheck("foreign keys have no orphan violations", async () => {
      const summary = await foreignKeyViolationCounts();
      if (summary.violating_fks > 0) {
        const preview = summary.violations
          .slice(0, 5)
          .map(
            (v) =>
              `${v.constraint} (${v.child_table} → ${v.parent_table}) has ${v.bad_count} orphan row(s)`,
          )
          .join("; ");
        throw new Error(
          `Found FK violations: ${preview}${summary.violations.length > 5 ? "…" : ""}`,
        );
      }
      return `Checked ${summary.total_fks} FK(s), no orphan rows found`;
    }),
  );

  results.push(
    await runCheck(
      "foreign keys have indexes (performance audit)",
      async () => {
        const info = await foreignKeysMissingIndexes();
        if (info.missing_index_count > 0) {
          return {
            warning: true,
            message: `Found ${info.missing_index_count} FK(s) without a simple supporting index (not always required, but recommended)`,
            suggestions: info.suggestions.slice(0, 25),
          };
        }
        return "All single-column FKs have a leading index";
      },
    ),
  );

  results.push(
    await runCheck("soft delete patterns have guardrails", async () => {
      const info = await softDeletePatternAudit();
      if (info.tables_with_issue > 0) {
        return {
          warning: true,
          message: `Found ${info.tables_with_issue} table(s) that look like soft-delete tables but lack a CHECK tying is_deleted/deleted_at`,
          offenders: info.offenders,
        };
      }
      return "All tables with is_deleted/deleted_at appear to have a guard CHECK constraint";
    }),
  );

  const ok = results.every((r) => r.passed);
  return Response.json({ ok, results });
}
