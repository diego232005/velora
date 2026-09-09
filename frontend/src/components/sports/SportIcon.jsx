import {
  Bike,
  Car,
  Circle,
  CircleDot,
  Dribbble,
  Gamepad2,
  Hexagon,
  LayoutGrid,
  Shield,
  Snowflake,
  Swords,
  Target,
  Trophy,
} from 'lucide-react';

const icons = {
  all: LayoutGrid,
  football: CircleDot,
  basketball: Dribbble,
  tennis: Circle,
  esports: Gamepad2,
  baseball: Target,
  hockey: Snowflake,
  volleyball: Hexagon,
  americanFootball: Shield,
  boxing: Trophy,
  mma: Swords,
  motorsport: Car,
  cycling: Bike,
};

export function SportIcon({ name, size = 18 }) {
  const Icon = icons[name] || CircleDot;
  return <Icon size={size} aria-hidden="true" />;
}
