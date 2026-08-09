import { cn } from "@/lib/utils";
import type { HealthStatus, Momentum } from "@/lib/project-insights";
import { he } from "@/lib/i18n/he";

const HEALTH_META: Record<HealthStatus, { label: string; dot: string }> = {
  "on-track": { label: he.health.onTrack, dot: "bg-status-green" },
  "needs-attention": { label: he.health.needsAttention, dot: "bg-status-yellow" },
  "at-risk": { label: he.health.atRisk, dot: "bg-status-red" },
  paused: { label: he.health.paused, dot: "bg-status-gray" },
};

export function HealthBadge({ health, className }: { health: HealthStatus; className?: string }) {
  const meta = HEALTH_META[health];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

const MOMENTUM_META: Record<Momentum, { label: string; icon: string }> = {
  high: { label: he.health.high, icon: "🔥" },
  moving: { label: he.health.moving, icon: "🟢" },
  slow: { label: he.health.slow, icon: "🟡" },
  stalled: { label: he.health.stalled, icon: "⚪" },
};

export function MomentumBadge({ momentum, className }: { momentum: Momentum; className?: string }) {
  const meta = MOMENTUM_META[momentum];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  );
}
