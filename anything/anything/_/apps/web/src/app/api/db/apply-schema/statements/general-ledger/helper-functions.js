export const helperFunctions = [
  // -----------------------
  // Helper: enforce that a journal entry balances before posting
  // -----------------------
  `CREATE OR REPLACE FUNCTION gl_assert_journal_entry_balanced(_je_id uuid)
    RETURNS void
    LANGUAGE plpgsql
    AS $$
    DECLARE
      debits numeric;
      credits numeric;
    BEGIN
      SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
      INTO debits, credits
      FROM journal_entry_lines
      WHERE journal_entry_id = _je_id;

      debits := round(debits, 2);
      credits := round(credits, 2);

      IF debits <> credits THEN
        RAISE EXCEPTION 'Journal entry % out of balance: debits=%, credits=%', _je_id, debits, credits;
      END IF;
    END;
    $$;`,

  `CREATE OR REPLACE FUNCTION gl_mark_posted(_je_id uuid)
    RETURNS void
    LANGUAGE plpgsql
    AS $$
    BEGIN
      PERFORM gl_assert_journal_entry_balanced(_je_id);
      UPDATE journal_entries
      SET posted = true, posted_at = now(), updated_at = now()
      WHERE id = _je_id;
    END;
    $$;`,
];
