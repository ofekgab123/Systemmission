"use client";

import { PageHeader } from "@/components/layout/page-header";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { he } from "@/lib/i18n/he";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <PageHeader title={he.settings.title} description={he.settings.description} />
      <div className="page-content">
        <div className="max-w-md rounded-xl border bg-card p-5">
          <Label className="mb-3 block text-sm font-medium">{he.settings.theme}</Label>
          <p className="mb-4 text-xs text-muted-foreground">{he.settings.themeDesc}</p>
          <div className="flex gap-2">
            {[
              { value: "light", label: "בהיר" },
              { value: "dark", label: "כהה" },
              { value: "system", label: "מערכת" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-smooth ${
                  theme === opt.value ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
