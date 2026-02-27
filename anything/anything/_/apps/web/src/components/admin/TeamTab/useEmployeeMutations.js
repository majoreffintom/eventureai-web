import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useEmployeeMutations({
  setFormError,
  setForm,
  setShowCreate,
  setShowEdit,
  setEditForm,
  setEditingEmployeeId,
}) {
  const queryClient = useQueryClient();

  const createEmployeeMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = data?.error || "Could not create employee";
        throw new Error(msg);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "employees"] });
      setFormError(null);
      setForm((prev) => ({
        ...prev,
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        roles: ["technician"],
      }));
      setShowCreate(false);
    },
    onError: (err) => {
      console.error(err);
      setFormError(err?.message || "Could not create employee");
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await fetch(
        `/api/admin/employees/${id}`.replace("//", "/"),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = data?.error || "Could not update employee";
        throw new Error(msg);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "employees"] });
      setFormError?.(null);
      setShowEdit?.(false);
      setEditingEmployeeId?.(null);
      setEditForm?.((prev) => ({
        ...prev,
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        roles: ["technician"],
      }));
    },
    onError: (err) => {
      console.error(err);
      setFormError?.(err?.message || "Could not update employee");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const response = await fetch(`/api/admin/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = data?.error || "Could not update employee";
        throw new Error(msg);
      }
      return data;
    },
    onMutate: async ({ id, is_active }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "employees"] });
      const prev = queryClient.getQueryData(["admin", "employees"]);

      queryClient.setQueryData(["admin", "employees"], (old) => {
        const safe = old && typeof old === "object" ? old : { employees: [] };
        const list = Array.isArray(safe.employees) ? safe.employees : [];
        const nextEmployees = list.map((e) => {
          if (e.id !== id) {
            return e;
          }
          return { ...e, is_active };
        });
        return { ...safe, employees: nextEmployees };
      });

      return { prev };
    },
    onError: (err, _vars, ctx) => {
      console.error(err);
      if (ctx?.prev) {
        queryClient.setQueryData(["admin", "employees"], ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "employees"] });
    },
  });

  return {
    createEmployeeMutation,
    updateEmployeeMutation,
    toggleActiveMutation,
  };
}
