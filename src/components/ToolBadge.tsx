import { Calculator, CloudSun, Clock } from 'lucide-react';

interface ToolBadgeProps {
  toolName: string;
  input?: string;
  result?: string;
  compact?: boolean;
}

const TOOL_INFO: Record<string, { label: string; icon: typeof Calculator; color: string }> = {
  calculator: { label: 'Used Calculator Tool', icon: Calculator, color: 'amber' },
  weather_datetime: { label: 'Fetched Weather/Date Data', icon: CloudSun, color: 'cyan' },
};

export default function ToolBadge({ toolName, input, result, compact }: ToolBadgeProps) {
  const info = TOOL_INFO[toolName] || { label: `Used ${toolName}`, icon: Clock, color: 'slate' };
  const Icon = info.icon;

  const colorClasses: Record<string, string> = {
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    cyan: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    slate: 'bg-slate-100 border-slate-200 text-slate-600',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${colorClasses[info.color]}`}>
      <Icon size={14} />
      <span>{info.label}</span>
      {!compact && result && (
        <span className="text-slate-400 ml-1 max-w-xs truncate">
          → {result.slice(0, 80)}{result.length > 80 ? '...' : ''}
        </span>
      )}
    </div>
  );
}
