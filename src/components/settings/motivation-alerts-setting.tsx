"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMotivationAlertsEnabled } from "@/hooks/use-motivation-alerts-enabled";
import { he } from "@/lib/i18n/he";

export function MotivationAlertsSetting() {
  const { enabled, setEnabled } = useMotivationAlertsEnabled();

  return (
    <div className="max-w-md rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Label className="text-sm font-medium">{he.motivation.settingsTitle}</Label>
          <p className="mt-1 text-xs text-muted-foreground">{he.motivation.settingsDesc}</p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} aria-label={he.motivation.settingsTitle} />
      </div>
    </div>
  );
}
