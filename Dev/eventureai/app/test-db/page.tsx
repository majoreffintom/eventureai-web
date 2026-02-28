"use client";

import { useEffect, useState } from "react";

export default function TestDBPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTenants() {
      try {
        const response = await fetch("/api/tenants");
        const data = await response.json();
        if (data.error) {
          setError(data.error);
        } else {
          setTenants(data);
        }
      } catch (err: any) {
        setError(err.message);
      }
    }
    fetchTenants();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
      {error && <p className="text-red-500">Error: {error}</p>}
      {!error && tenants.length === 0 && <p>No tenants found (or loading...)</p>}
      <ul className="list-disc ml-6">
        {tenants.map((t) => (
          <li key={t.id}>{t.name} ({t.slug})</li>
        ))}
      </ul>
      <div className="mt-8">
        <a href="/" className="text-blue-500 underline">Back to Home</a>
      </div>
    </div>
  );
}
