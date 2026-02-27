import { useMemo } from "react";
import { Button, Input, Select, Text } from "@/components/ds.jsx";

export function EmployeeForm({
  form,
  setForm,
  formError,
  onSubmit,
  onCancel,
  isSubmitting,
  mode = "create",
}) {
  const roleOptions = useMemo(
    () => [
      { value: "owner", label: "Owner" },
      { value: "admin", label: "Admin" },
      { value: "technician", label: "Technician" },
      { value: "install", label: "Install" },
      { value: "apprentice", label: "Apprentice" },
    ],
    [],
  );

  const payOptions = useMemo(
    () => [
      { value: "hourly", label: "Hourly" },
      { value: "salary", label: "Salary" },
    ],
    [],
  );

  const isHourly = form.pay_type === "hourly";
  const isEdit = mode === "edit";
  const primaryLabel = isEdit ? "Save" : "Create";
  const submittingLabel = isEdit ? "Saving…" : "Creating…";

  return (
    <div className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="First name"
          value={form.first_name}
          onChange={(e) =>
            setForm((p) => ({ ...p, first_name: e.target.value }))
          }
          placeholder="First"
        />
        <Input
          label="Last name"
          value={form.last_name}
          onChange={(e) =>
            setForm((p) => ({ ...p, last_name: e.target.value }))
          }
          placeholder="Last"
        />

        <Input
          label="Email (optional)"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          placeholder="tech@company.com"
        />
        <Input
          label="Phone (optional)"
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          placeholder="(555) 555-5555"
        />
        <div className="md:col-span-2">
          <Text as="div" size="sm" tone="secondary" className="mb-2">
            Roles
          </Text>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {roleOptions.map((opt) => {
              const checked = Array.isArray(form.roles)
                ? form.roles.includes(opt.value)
                : false;

              return (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] px-3 py-2 text-sm text-[var(--ds-text-primary)]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const nextChecked = e.target.checked;
                      setForm((p) => {
                        const prev = Array.isArray(p.roles) ? p.roles : [];
                        const next = nextChecked
                          ? Array.from(new Set([...prev, opt.value]))
                          : prev.filter((r) => r !== opt.value);

                        // ensure at least one role
                        const safeNext = next.length ? next : ["technician"];
                        return { ...p, roles: safeNext };
                      });
                    }}
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
          <Text as="div" size="xs" tone="tertiary" className="mt-2">
            Tip: you can give someone multiple roles (e.g. Technician + Admin).
          </Text>
        </div>

        <Select
          label="Pay type"
          value={form.pay_type}
          onChange={(e) => setForm((p) => ({ ...p, pay_type: e.target.value }))}
          options={payOptions}
        />

        {isHourly ? (
          <Input
            label="Hourly rate"
            value={form.hourly_rate}
            onChange={(e) =>
              setForm((p) => ({ ...p, hourly_rate: e.target.value }))
            }
            placeholder="0"
          />
        ) : (
          <Input
            label="Salary (annual)"
            value={form.salary_annual}
            onChange={(e) =>
              setForm((p) => ({ ...p, salary_annual: e.target.value }))
            }
            placeholder="60000"
          />
        )}
      </div>

      {formError ? (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {formError}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <Button disabled={isSubmitting} onClick={onSubmit}>
          {isSubmitting ? submittingLabel : primaryLabel}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
