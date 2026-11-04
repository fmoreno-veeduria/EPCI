import React from 'react';
import {
  Users,
  ShieldCheck,
  HeartHandshake,
  Vote,
  Network,
  ShieldAlert,
  Bus,
  TrendingUp,
  Heart,
  Landmark,
  Zap,
  FileText,
  Compass,
  Target
} from 'lucide-react';

export const MODULE_ICONS: Record<string, React.ElementType> = {
  sociodemografico: Users,
  confianza: ShieldCheck,
  corresponsabilidad: HeartHandshake,
  participacion: Vote,
  relacionamiento: Network,
  temas_prioritarios: Compass,
  prioridades: Compass,
  seguridad: ShieldAlert,
  movilidad: Bus,
  desarrollo: TrendingUp,
  bienestar: Heart,
  gestion: Landmark,
  servicios: Zap,
};

interface ModuleIconProps {
  moduleKey: string;
  className?: string;
}

export default function ModuleIcon({ moduleKey, className = "h-5 w-5" }: ModuleIconProps) {
  const Icon = MODULE_ICONS[moduleKey] || FileText;
  return <Icon className={className} />;
}
