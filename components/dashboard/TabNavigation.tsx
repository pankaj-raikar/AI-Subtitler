
import { cn } from "@/lib/utils";

interface TabNavigationProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-border mb-6 overflow-x-auto">
      <div className="flex space-x-1 pb-1 min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              "px-3 sm:px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap",
              activeTab === tab
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
