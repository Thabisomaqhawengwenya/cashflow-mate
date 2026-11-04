import { Ionicons } from '@expo/vector-icons';

export interface AvatarPreset {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  bgColor: string;
  iconColor: string;
  badgeLabel: string;
}

export const PRESET_AVATARS: AvatarPreset[] = [
  {
    id: 'tuckshop_boss',
    title: 'Tuckshop Boss',
    subtitle: 'Daily Grocery & Provisions',
    icon: 'storefront',
    bgColor: '#0C3E35',
    iconColor: '#34D399',
    badgeLabel: 'GROCERY & PROVISIONS',
  },
  {
    id: 'executive_trader',
    title: 'Executive Trader',
    subtitle: 'Wholesale & Enterprise',
    icon: 'briefcase',
    bgColor: '#06152E',
    iconColor: '#38BDF8',
    badgeLabel: 'WHOLESALE B2B',
  },
  {
    id: 'musika_produce',
    title: 'Produce Merchant',
    subtitle: 'Mbare Musika Fresh Farm',
    icon: 'nutrition',
    bgColor: '#D97706',
    iconColor: '#FEF3C7',
    badgeLabel: 'MBARE MUSIKA',
  },
  {
    id: 'ecocash_agent',
    title: 'EcoCash Agent',
    subtitle: 'Cash-In & Float Booth',
    icon: 'phone-portrait',
    bgColor: '#0284C7',
    iconColor: '#E0F2FE',
    badgeLabel: 'MOBILE FLOAT',
  },
  {
    id: 'cbd_boutique',
    title: 'Boutique Stylist',
    subtitle: 'Apparel, Bales & Shoes',
    icon: 'shirt',
    bgColor: '#7E22CE',
    iconColor: '#F3E8FF',
    badgeLabel: 'FASHION & BALES',
  },
  {
    id: 'cross_border',
    title: 'Border Runner',
    subtitle: 'ZAR Float & Beitbridge',
    icon: 'bus',
    bgColor: '#EA580C',
    iconColor: '#FFEDD5',
    badgeLabel: 'BEITBRIDGE RUNNER',
  },
];

export function getPresetById(id?: string | null): AvatarPreset | undefined {
  if (!id) return undefined;
  return PRESET_AVATARS.find((p) => p.id === id);
}
