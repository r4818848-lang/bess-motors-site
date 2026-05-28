"use client";

import {
  Battery,
  Calendar,
  Camera,
  Circle,
  CircleDot,
  Clock,
  Cog,
  Cpu,
  Crosshair,
  Disc,
  Droplets,
  Fan,
  Filter,
  Flame,
  Fuel,
  HelpCircle,
  Gauge,
  Monitor,
  Paintbrush,
  ScanLine,
  Settings,
  Settings2,
  Shield,
  Snowflake,
  Sparkles,
  Sun,
  Tag,
  Thermometer,
  Volume2,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Droplets,
  Wind,
  Disc,
  Scan: ScanLine,
  ScanLine,
  Settings,
  Filter,
  Circle,
  Crosshair,
  Zap,
  CircleDot,
  Snowflake,
  Clock,
  Cog,
  Settings2,
  Sparkles,
  Sun,
  Paintbrush,
  Gauge,
  Cpu,
  Fan,
  Flame,
  Thermometer,
  Battery,
  Monitor,
  Camera,
  Volume2,
  Shield,
  Fuel,
  HelpCircle,
  Calendar,
  Tag,
};

interface Props {
  name: string;
  size?: number;
  className?: string;
}

export function ServiceIcon({ name, size = 20, className }: Props) {
  const Icon = iconMap[name] ?? Wrench;
  return <Icon size={size} className={className} />;
}
