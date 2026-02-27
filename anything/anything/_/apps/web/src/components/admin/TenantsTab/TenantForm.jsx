import { useState, useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button, Panel, Text, Input } from "@/components/ds.jsx";

export function TenantForm({ mode, initialData, onSubmit, onCancel, isLoading, error }) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    domain: "",
    is_active: true,
    config: {},
  });

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setForm({
        name: initialData.name || "",
        slug: initialData.slug || "",
        description: initialData.description || "",
        domain: initialData.domain || "",
        is_active: initialData.is_active ?? true,
        config: initialData.config || {},
      });
    }
  }, [mode, initialData]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Auto-generate slug from name
    if (field === "name" && mode === "create") {
      const autoSlug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      setForm((prev) => ({ ...prev, slug: autoSlug }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const title = mode === "create" ? "Add Tenant" : "Edit Tenant";
  const subtitle = mode === "create"
    ? "Create a new tenant for the platform."
    : `Editing ${initialData?.name || "tenant"}`;

  return (
    <Panel
      title={title}
      subtitle={subtitle}
      right={
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onCancel}>
          Back
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <Text size="sm" tone="danger">{error}</Text>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., My App"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Slug <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.slug}
              onChange={(e) => handleChange("slug", e.target.value)}
              placeholder="e.g., my-app"
              required
            />
            <Text size="xs" tone="tertiary" className="mt-1">
              URL-friendly identifier. Auto-generated from name.
            </Text>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Domain</label>
          <Input
            value={form.domain}
            onChange={(e) => handleChange("domain", e.target.value)}
            placeholder="e.g., myapp.com"
          />
          <Text size="xs" tone="tertiary" className="mt-1">
            Custom domain for this tenant (optional).
          </Text>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Brief description of this tenant..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={form.is_active}
            onChange={(e) => handleChange("is_active", e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <label htmlFor="is_active" className="text-sm">
            Active
          </label>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : mode === "create" ? "Create Tenant" : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}
