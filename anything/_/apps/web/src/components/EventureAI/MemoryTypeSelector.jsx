import { Database, Server, Shield } from "lucide-react";

const memoryTypes = [
  { value: "app", label: "App Memory", icon: Database, color: "blue" },
  {
    value: "business",
    label: "Business Memory",
    icon: Server,
    color: "green",
  },
  {
    value: "enterprise",
    label: "Enterprise Memory",
    icon: Shield,
    color: "purple",
  },
];

export function MemoryTypeSelector({
  selectedMemoryType,
  setSelectedMemoryType,
}) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-6">
      <h3 className="font-semibold text-[#0F172A] dark:text-white mb-4">
        Memory Type
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {memoryTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedMemoryType === type.value;
          return (
            <button
              key={type.value}
              onClick={() => setSelectedMemoryType(type.value)}
              className={`p-4 rounded-lg border-2 transition-all duration-150 ${
                isSelected
                  ? `border-${type.color}-500 bg-${type.color}-50 dark:bg-${type.color}-900/20`
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <Icon
                size={24}
                className={`mx-auto mb-2 ${
                  isSelected ? `text-${type.color}-600` : "text-gray-400"
                }`}
              />
              <div className="text-sm font-medium text-[#0F172A] dark:text-white">
                {type.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { memoryTypes };
