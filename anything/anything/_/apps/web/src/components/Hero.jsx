export default function Hero() {
  // Use the user-provided hero image (Uploadcare asset) instead of the old stock/placeholder.
  const imageUrl =
    "https://ucarecdn.com/b6ee1956-442f-4b9f-a47e-8fa4f7ed1808/-/format/auto/";

  return (
    <div className="overflow-hidden rounded-[24px] border border-[var(--ds-border)] bg-[var(--ds-surface)]">
      <img
        src={imageUrl}
        alt="Goldey's Heating & Cooling service"
        className="h-[260px] w-full object-cover md:h-[380px]"
      />
    </div>
  );
}
