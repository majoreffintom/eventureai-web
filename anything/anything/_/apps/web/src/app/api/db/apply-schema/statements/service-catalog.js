export const serviceCatalogStatements = [
  `CREATE TABLE IF NOT EXISTS service_catalog (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category text NOT NULL,
    name text NOT NULL,
    description text,
    default_price numeric(12,2) NOT NULL DEFAULT 0,
    cost_basis numeric(12,2),
    estimated_labor_minutes integer,
    is_taxable boolean NOT NULL DEFAULT true,
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer,
    is_deleted boolean NOT NULL DEFAULT false,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT service_catalog_category_chk CHECK (category IN ('repair','maintenance','installation','diagnostic','parts')),
    CONSTRAINT service_catalog_price_chk CHECK (default_price >= 0),
    CONSTRAINT service_catalog_deleted_at_chk CHECK ((is_deleted = false AND deleted_at IS NULL) OR (is_deleted = true AND deleted_at IS NOT NULL))
  );`,
  "CREATE UNIQUE INDEX IF NOT EXISTS service_catalog_unique_idx ON service_catalog(category, lower(name)) WHERE is_deleted = false;",
];
