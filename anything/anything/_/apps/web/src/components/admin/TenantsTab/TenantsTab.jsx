import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Edit, Trash2, Plus, RefreshCw } from "lucide-react";
import { Button, Panel, Table, Text, Badge } from "@/components/ds.jsx";
import { EmptyState } from "../EmptyState";
import { TenantForm } from "./TenantForm";

export function TenantsTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [formError, setFormError] = useState(null);

  const queryClient = useQueryClient();

  const tenantsQuery = useQuery({
    queryKey: ["admin", "tenants"],
    queryFn: async () => {
      const response = await fetch("/api/admin/tenants", { method: "GET" });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch tenants: [${response.status}] ${response.statusText}`
        );
      }
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to create tenant");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] });
      setShowCreate(false);
      setFormError(null);
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update tenant");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] });
      setEditingTenant(null);
      setFormError(null);
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to delete tenant");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] });
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const tenants = tenantsQuery.data?.tenants || [];
  const isLoading = tenantsQuery.isLoading;
  const isError = tenantsQuery.isError;

  const handleCreate = (data) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data) => {
    if (editingTenant) {
      updateMutation.mutate({ id: editingTenant.id, data });
    }
  };

  const handleDelete = (tenant) => {
    if (window.confirm(`Delete tenant "${tenant.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(tenant.id);
    }
  };

  const columns = [
    {
      key: "id",
      header: "ID",
      render: (row) => <Text size="sm" tone="secondary">{row.id}</Text>,
    },
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-gray-400" />
          <Text size="sm" className="font-medium">{row.name}</Text>
        </div>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      render: (row) => <Text size="sm" tone="secondary">{row.slug}</Text>,
    },
    {
      key: "domain",
      header: "Domain",
      render: (row) => (
        row.domain ? (
          <a
            href={`https://${row.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-sm"
          >
            {row.domain}
          </a>
        ) : (
          <Text size="sm" tone="tertiary">—</Text>
        )
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant={row.is_active ? "success" : "secondary"}>
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            icon={Edit}
            onClick={() => setEditingTenant(row)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => handleDelete(row)}
            className="text-red-500 hover:text-red-600"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (showCreate) {
    return (
      <TenantForm
        mode="create"
        onSubmit={handleCreate}
        onCancel={() => {
          setShowCreate(false);
          setFormError(null);
        }}
        isLoading={createMutation.isPending}
        error={formError}
      />
    );
  }

  if (editingTenant) {
    return (
      <TenantForm
        mode="edit"
        initialData={editingTenant}
        onSubmit={handleUpdate}
        onCancel={() => {
          setEditingTenant(null);
          setFormError(null);
        }}
        isLoading={updateMutation.isPending}
        error={formError}
      />
    );
  }

  return (
    <Panel
      title="Tenants"
      subtitle="Manage platform tenants and their databases."
      right={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => tenantsQuery.refetch()}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setShowCreate(true)}
          >
            Add Tenant
          </Button>
        </div>
      }
    >
      {isLoading && (
        <Text tone="secondary">Loading tenants...</Text>
      )}

      {isError && (
        <Text tone="danger">Failed to load tenants. Please try again.</Text>
      )}

      {!isLoading && !isError && tenants.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No tenants yet"
          description="Add your first tenant to get started."
          action={
            <Button variant="primary" icon={Plus} onClick={() => setShowCreate(true)}>
              Add Tenant
            </Button>
          }
        />
      )}

      {!isLoading && !isError && tenants.length > 0 && (
        <Table columns={columns} data={tenants} rowKey="id" />
      )}
    </Panel>
  );
}
