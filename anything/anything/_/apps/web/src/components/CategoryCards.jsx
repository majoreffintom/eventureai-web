import { Heading, Text } from "./ds.jsx";

export default function CategoryCards({ title, items }) {
  return (
    <section>
      <div className="flex items-end justify-between gap-3">
        <Heading level={2} className="text-xl md:text-2xl">
          {title}
        </Heading>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => {
          const isDanger = item.variant === "danger";
          const borderCls = isDanger
            ? "border-[var(--ds-danger-border)]"
            : "border-[var(--ds-border)]";
          const hoverCls = "hover:bg-[var(--ds-bg-tertiary)]";

          return (
            <a
              key={`${item.title}-${item.href}`}
              href={item.href}
              className={`rounded-2xl border ${borderCls} bg-[var(--ds-surface)] p-5 transition-colors ${hoverCls} no-underline`}
            >
              <Text as="div" tone="primary" className="font-semibold">
                {item.title}
              </Text>
              <Text size="sm" tone="tertiary" className="mt-2">
                {item.description}
              </Text>
            </a>
          );
        })}
      </div>
    </section>
  );
}
