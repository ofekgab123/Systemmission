import {
  Layers,
  Briefcase,
  Code2,
  FlaskConical,
  User,
  Wallet,
  ShoppingCart,
  GraduationCap,
  ClipboardList,
  Lightbulb,
  Wrench,
  Folder,
  Rocket,
  Home,
  Heart,
  Server,
  Mic,
  Plane,
  Camera,
  Music,
  Palette,
  Dumbbell,
  BookOpen,
  Globe,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const ICON_OPTIONS: { name: string; icon: LucideIcon }[] = [
  { name: "Layers", icon: Layers },
  { name: "Briefcase", icon: Briefcase },
  { name: "Code2", icon: Code2 },
  { name: "FlaskConical", icon: FlaskConical },
  { name: "User", icon: User },
  { name: "Wallet", icon: Wallet },
  { name: "ShoppingCart", icon: ShoppingCart },
  { name: "GraduationCap", icon: GraduationCap },
  { name: "ClipboardList", icon: ClipboardList },
  { name: "Lightbulb", icon: Lightbulb },
  { name: "Wrench", icon: Wrench },
  { name: "Folder", icon: Folder },
  { name: "Rocket", icon: Rocket },
  { name: "Home", icon: Home },
  { name: "Heart", icon: Heart },
  { name: "Server", icon: Server },
  { name: "Mic", icon: Mic },
  { name: "Plane", icon: Plane },
  { name: "Camera", icon: Camera },
  { name: "Music", icon: Music },
  { name: "Palette", icon: Palette },
  { name: "Dumbbell", icon: Dumbbell },
  { name: "BookOpen", icon: BookOpen },
  { name: "Globe", icon: Globe },
  { name: "Sparkles", icon: Sparkles },
];

const ICON_MAP = new Map(ICON_OPTIONS.map((o) => [o.name, o.icon]));

export function resolveIcon(name: string | null | undefined): LucideIcon {
  return (name && ICON_MAP.get(name)) || Folder;
}

export const AREA_COLOR_OPTIONS = [
  "#6366f1", // indigo
  "#3b82f6", // blue
  "#22c55e", // green
  "#eab308", // yellow
  "#f97316", // orange
  "#ef4444", // red
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#64748b", // slate
];
