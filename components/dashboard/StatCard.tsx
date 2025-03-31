
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  iconColor: string;
}

export default function StatCard({ title, value, description, icon: Icon, iconColor }: StatCardProps) {
  return (
    <div className="card-dashboard">
      <div className="card-stats">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium">{title}</h3>
          <div className={`${iconColor} p-1 rounded-full`}>
            <Icon size={16} />
          </div>
        </div>
        <div className="stats-number">{value}</div>
        <div className="stats-label">{description}</div>
      </div>
    </div>
  );
}
