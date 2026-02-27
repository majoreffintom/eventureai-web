"use client";

import { useCallback, useMemo, useState } from "react";
import { X, PlusCircle, Sparkles } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const PRESETS = [
  {
    name: "DITZL",
    domain_url: "https://ditzl.com",
    description: "DITZL - source app for cross-app conversations",
    app_type: "internal",
  },
  {
    name: "Rosebud Veneer",
    domain_url: "https://rosebudveneer.com",
    description: "Rosebud Veneer - cross-app conversation source",
    app_type: "internal",
  },
  {
    name: "BeTheFirstNFT",
    domain_url: "https://bethefirstnft.com",
    description: "BeTheFirstNFT - cross-app conversation source",
    app_type: "internal",
  },
];

export default function AddAppModal({ open, onClose }) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [domainUrl, setDomainUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const canSubmit = useMemo(() => {
    const ok = Boolean(name.trim()) && Boolean(domainUrl.trim());
    return ok;
  }, [name, domainUrl]);

  const addDomainsMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/apps/add-domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `When calling /api/apps/add-domains, the response was [${response.status}] ${text}`,
        );
      }
      return response.json();
    },
    onSuccess: async () => {
      setError(null);
      setSuccess(
        "App added. Next step: add MEMORIA_EXPORT_KEY in Secrets for this app.",
      );
      await queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
    onError: (e) => {
      console.error(e);
      setSuccess(null);
      setError(e.message || "Could not add app");
    },
  });

  const onSubmit = useCallback(async () => {
    setError(null);
    setSuccess(null);

    if (!canSubmit) {
      setError("Please enter a name and a domain");
      return;
    }

    addDomainsMutation.mutate({
      domains: [
        {
          name: name.trim(),
          domain_url: domainUrl.trim(),
          description: description.trim() || null,
          app_type: "internal",
          environment: "production",
          status: "active",
        },
      ],
    });
  }, [addDomainsMutation, canSubmit, description, domainUrl, name]);

  const addPreset = useCallback(
    async (preset) => {
      setError(null);
      setSuccess(null);

      addDomainsMutation.mutate({
        domains: [
          {
            ...preset,
            environment: "production",
            status: "active",
          },
        ],
      });
    },
    [addDomainsMutation],
  );

  const closeDisabled = addDomainsMutation.isPending;

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          if (closeDisabled) {
            return;
          }
          onClose();
        }}
      />

      <div className="relative w-full max-w-[720px] bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#EAECF0] dark:border-[#404040] shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAECF0] dark:border-[#404040]">
          <div>
            <h2 className="font-inter font-semibold text-lg text-[#0F172A] dark:text-white">
              Add an App
            </h2>
            <p className="text-sm text-[#667085] dark:text-[#A1A1AA]">
              Add a domain, then set{" "}
              <span className="font-semibold">MEMORIA_EXPORT_KEY</span> in
              Secrets.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (closeDisabled) {
                return;
              }
              onClose();
            }}
            className="p-2 rounded-lg hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors"
            aria-label="Close"
          >
            <X size={18} className="text-[#667085] dark:text-[#A1A1AA]" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <div className="text-sm font-semibold text-[#0F172A] dark:text-white mb-2 flex items-center gap-2">
                <Sparkles size={16} />
                Quick add
              </div>
              <div className="space-y-2">
                {PRESETS.map((p) => {
                  return (
                    <button
                      key={p.domain_url}
                      type="button"
                      onClick={() => addPreset(p)}
                      disabled={addDomainsMutation.isPending}
                      className="w-full text-left px-4 py-3 rounded-xl border border-[#E4E7EC] dark:border-[#404040] hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors disabled:opacity-60"
                    >
                      <div className="font-inter font-semibold text-[#0F172A] dark:text-white">
                        {p.name}
                      </div>
                      <div className="text-sm text-[#667085] dark:text-[#A1A1AA]">
                        {p.domain_url}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-xs text-[#667085] dark:text-[#A1A1AA]">
              Tip: after adding an app, go to its{" "}
              <span className="font-semibold">Secrets</span> tab and add a
              secret named{" "}
              <span className="font-semibold">MEMORIA_EXPORT_KEY</span>.
            </div>
          </div>

          <div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="DITZL"
                  className="w-full h-[44px] px-4 rounded-xl border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
                  Domain
                </label>
                <input
                  value={domainUrl}
                  onChange={(e) => setDomainUrl(e.target.value)}
                  placeholder="https://ditzl.com"
                  className="w-full h-[44px] px-4 rounded-xl border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this app?"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 dark:text-red-300">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-sm text-green-700 dark:text-green-300">
                  {success}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (closeDisabled) {
                      return;
                    }
                    onClose();
                  }}
                  className="h-[44px] px-5 rounded-full border border-[#E4E7EC] dark:border-[#404040] text-[#0F172A] dark:text-white hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={!canSubmit || addDomainsMutation.isPending}
                  className="h-[44px] px-5 rounded-full bg-[#0F172A] hover:bg-[#17233A] text-white font-semibold disabled:opacity-60 inline-flex items-center gap-2"
                >
                  <PlusCircle size={16} />
                  {addDomainsMutation.isPending ? "Adding..." : "Add App"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
