export function ErrorDisplay({ error }) {
  if (!error) return null;

  return (
    <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm">
      {error}
    </div>
  );
}
