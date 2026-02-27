import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Panel, Select, Table, Text } from "@/components/ds.jsx";
import { EmptyState } from "../EmptyState";
import { EmployeeForm } from "./EmployeeForm";
import { useEmployeeColumns } from "./useEmployeeColumns";
import { useTimeclockColumns } from "./useTimeclockColumns";
import { useEmployeeMutations } from "./useEmployeeMutations";

export function TeamTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    roles: ["technician"],
    pay_type: "hourly",
    hourly_rate: "0",
    salary_annual: "60000",
    is_active: true,
  });

  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    roles: ["technician"],
    pay_type: "hourly",
    hourly_rate: "0",
    salary_annual: "60000",
    is_active: true,
  });

  const [formError, setFormError] = useState(null);

  const employeesQuery = useQuery({
    queryKey: ["admin", "employees"],
    queryFn: async () => {
      const response = await fetch("/api/admin/employees", { method: "GET" });
      if (!response.ok) {
        throw new Error(
          `When fetching /api/admin/employees, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return response.json();
    },
  });

  const timeclockQuery = useQuery({
    queryKey: ["admin", "timeclock", "recent"],
    queryFn: async () => {
      const response = await fetch("/api/admin/timeclock/recent", {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error(
          `When fetching /api/admin/timeclock/recent, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return response.json();
    },
  });

  const {
    createEmployeeMutation,
    updateEmployeeMutation,
    toggleActiveMutation,
  } = useEmployeeMutations({
    setFormError,
    setForm,
    setShowCreate,
    setShowEdit,
    setEditForm,
    setEditingEmployeeId,
  });

  const employeesPayload = employeesQuery.data;
  const employees = employeesPayload?.employees || [];
  const employeesLoading = employeesQuery.isLoading;
  const employeesError = employeesQuery.error
    ? "Could not load employees"
    : null;

  const entriesPayload = timeclockQuery.data;
  const entries = entriesPayload?.entries || [];
  const entriesLoading = timeclockQuery.isLoading;
  const entriesError = timeclockQuery.error ? "Could not load timeclock" : null;

  const employeeColumns = useEmployeeColumns(toggleActiveMutation);
  const timeclockColumns = useTimeclockColumns();

  const employeeSelectOptions = useMemo(() => {
    const list = Array.isArray(employees) ? employees : [];
    return list.map((e) => ({
      value: e.id,
      label: e.name || "(Unnamed)",
    }));
  }, [employees]);

  const splitName = (fullName) => {
    const raw = typeof fullName === "string" ? fullName.trim() : "";
    if (!raw) {
      return { firstName: "", lastName: "" };
    }
    const parts = raw.split(/\s+/).filter(Boolean);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ");
    return { firstName, lastName };
  };

  useEffect(() => {
    if (!showEdit) {
      return;
    }

    if (!editingEmployeeId) {
      return;
    }

    const selected = employees.find((e) => e.id === editingEmployeeId);
    if (!selected) {
      return;
    }

    const names = splitName(selected.name);
    const roles =
      Array.isArray(selected.roles) && selected.roles.length
        ? selected.roles
        : selected.role
          ? [selected.role]
          : ["technician"];

    const payType = selected.pay_type || "hourly";
    const nextHourly =
      selected.hourly_rate !== null && selected.hourly_rate !== undefined
        ? String(selected.hourly_rate)
        : "0";
    const nextSalary =
      selected.salary_annual !== null && selected.salary_annual !== undefined
        ? String(selected.salary_annual)
        : "60000";

    setEditForm({
      first_name: names.firstName,
      last_name: names.lastName,
      email: selected.email || "",
      phone: selected.phone || "",
      roles,
      pay_type: payType,
      hourly_rate: nextHourly,
      salary_annual: nextSalary,
      is_active: !!selected.is_active,
    });
  }, [employees, editingEmployeeId, showEdit]);

  const handleSubmitCreate = () => {
    setFormError(null);

    const first = (form.first_name || "").trim();
    const last = (form.last_name || "").trim();

    if (!first || !last) {
      setFormError("First name and last name are required");
      return;
    }

    const combinedName = `${first} ${last}`.trim();

    const chosenRoles = Array.isArray(form.roles)
      ? form.roles.filter(Boolean)
      : [];
    const safeRoles = chosenRoles.length
      ? Array.from(new Set(chosenRoles))
      : ["technician"];
    const primaryRole = safeRoles[0] || "technician";

    const isHourly = form.pay_type === "hourly";

    const payload = {
      name: combinedName,
      email: form.email,
      phone: form.phone,
      role: primaryRole,
      roles: safeRoles,
      pay_type: form.pay_type,
      hourly_rate: isHourly ? form.hourly_rate : null,
      salary_annual: isHourly ? null : form.salary_annual,
      is_active: true,
    };

    createEmployeeMutation.mutate(payload);
  };

  const handleSubmitEdit = () => {
    setFormError(null);

    if (!editingEmployeeId) {
      setFormError("Pick an employee to edit");
      return;
    }

    const first = (editForm.first_name || "").trim();
    const last = (editForm.last_name || "").trim();

    if (!first || !last) {
      setFormError("First name and last name are required");
      return;
    }

    const combinedName = `${first} ${last}`.trim();

    const chosenRoles = Array.isArray(editForm.roles)
      ? editForm.roles.filter(Boolean)
      : [];
    const safeRoles = chosenRoles.length
      ? Array.from(new Set(chosenRoles))
      : ["technician"];
    const primaryRole = safeRoles[0] || "technician";

    const isHourly = editForm.pay_type === "hourly";

    const payload = {
      name: combinedName,
      email: editForm.email,
      phone: editForm.phone,
      role: primaryRole,
      roles: safeRoles,
      pay_type: editForm.pay_type,
      hourly_rate: isHourly ? editForm.hourly_rate : null,
      salary_annual: isHourly ? null : editForm.salary_annual,
      is_active: editForm.is_active,
    };

    updateEmployeeMutation.mutate({ id: editingEmployeeId, payload });
  };

  const createBtnLabel = showCreate ? "Close" : "Add employee";
  const editBtnLabel = showEdit ? "Close edit" : "Edit employee";

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={showCreate ? "secondary" : "primary"}
        onClick={() => {
          setFormError(null);
          setShowEdit(false);
          setEditingEmployeeId(null);
          setShowCreate((v) => !v);
        }}
      >
        {createBtnLabel}
      </Button>
      <Button
        size="sm"
        variant={showEdit ? "secondary" : "ghost"}
        onClick={() => {
          setFormError(null);
          setShowCreate(false);

          setShowEdit((v) => {
            const next = !v;
            if (!next) {
              setEditingEmployeeId(null);
            } else {
              // if exactly one employee exists, auto-select it
              const only = employees.length === 1 ? employees[0] : null;
              if (only && only.id) {
                setEditingEmployeeId(only.id);
              }
            }
            return next;
          });
        }}
      >
        {editBtnLabel}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <Panel
        title="Employees"
        subtitle="Add your techs and office staff here."
        right={headerActions}
      >
        {showCreate ? (
          <EmployeeForm
            form={form}
            setForm={setForm}
            formError={formError}
            onSubmit={handleSubmitCreate}
            onCancel={() => setShowCreate(false)}
            isSubmitting={createEmployeeMutation.isPending}
            mode="create"
          />
        ) : null}

        {showEdit ? (
          <div className={showCreate ? "mt-4" : ""}>
            <div className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-bg-secondary)] p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Choose employee"
                  value={editingEmployeeId || ""}
                  onChange={(e) => setEditingEmployeeId(e.target.value || null)}
                  options={[
                    { value: "", label: "Select…" },
                    ...employeeSelectOptions,
                  ]}
                />
              </div>
            </div>

            {editingEmployeeId ? (
              <div className="mt-4">
                <EmployeeForm
                  form={editForm}
                  setForm={setEditForm}
                  formError={formError}
                  onSubmit={handleSubmitEdit}
                  onCancel={() => {
                    setShowEdit(false);
                    setEditingEmployeeId(null);
                  }}
                  isSubmitting={updateEmployeeMutation.isPending}
                  mode="edit"
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {employeesError ? <Text tone="danger">{employeesError}</Text> : null}

        {employeesLoading ? (
          <Text tone="secondary">Loading employees…</Text>
        ) : employees.length ? (
          <Table columns={employeeColumns} rows={employees} className="mt-4" />
        ) : (
          <div className="mt-4">
            <EmptyState
              title="No employees yet"
              body="Add your first employee to start tracking time and payroll."
            />
          </div>
        )}
      </Panel>

      <Panel
        title="Recent timeclock"
        subtitle="Latest 25 time entries. (We'll add clock-in/out next.)"
      >
        {entriesError ? <Text tone="danger">{entriesError}</Text> : null}

        {entriesLoading ? (
          <Text tone="secondary">Loading timeclock…</Text>
        ) : entries.length ? (
          <Table columns={timeclockColumns} rows={entries} />
        ) : (
          <EmptyState
            title="No time entries yet"
            body="Once techs start clocking in, you'll see activity here."
          />
        )}
      </Panel>
    </div>
  );
}
