
import {
  PlayCircle,
  Clock,
  Activity,
  Zap,
} from "lucide-react";

const stats = [
  {
    title: "Total Tests",
    value: "--",
    description: "Completed test sessions",
    icon: PlayCircle,
  },
  {
    title: "Avg. Startup Time",
    value: "--",
    description: "Time to first frame",
    icon: Clock,
  },
  {
    title: "Buffering Duration",
    value: "--",
    description: "Average per test",
    icon: Activity,
  },
  {
    title: "Cache Hit Rate",
    value: "--",
    description: "Simulated cache results",
    icon: Zap,
  },
];

export default function DashboardStats() {
  return (
    <div className="dashboard-stats">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div className="stat-card" key={stat.title}>
            <div className="stat-card-top">
              <span>{stat.title}</span>
              <Icon size={21} />
            </div>

            <h2>{stat.value}</h2>
            <p>{stat.description}</p>
          </div>
        );
      })}
    </div>
  );
}
