export interface EventColorPreset {
  id: 'carmine' | 'forest' | 'brass' | 'prussian' | 'ink';
  labelEn: string;
  labelAr: string;
  accent: string;
  bg: string;
  hoverBg: string;
}

export const EVENT_COLOR_PRESETS: EventColorPreset[] = [
  {
    id: 'carmine',
    labelEn: 'Carmine',
    labelAr: 'قرمزي',
    accent: '#832613',
    bg: 'rgba(131, 38, 19, 0.08)',
    hoverBg: 'rgba(131, 38, 19, 0.14)',
  },
  {
    id: 'forest',
    labelEn: 'Forest',
    labelAr: 'أخضر داكن',
    accent: '#2d5a46',
    bg: 'rgba(45, 90, 70, 0.09)',
    hoverBg: 'rgba(45, 90, 70, 0.15)',
  },
  {
    id: 'brass',
    labelEn: 'Amber',
    labelAr: 'عنبر',
    accent: '#9a6700',
    bg: 'rgba(154, 103, 0, 0.09)',
    hoverBg: 'rgba(154, 103, 0, 0.16)',
  },
  {
    id: 'prussian',
    labelEn: 'Prussian',
    labelAr: 'أزرق حبري',
    accent: '#2c4a6e',
    bg: 'rgba(44, 74, 110, 0.09)',
    hoverBg: 'rgba(44, 74, 110, 0.15)',
  },
  {
    id: 'ink',
    labelEn: 'Charcoal',
    labelAr: 'فحمي',
    accent: '#3f3a34',
    bg: 'rgba(63, 58, 52, 0.08)',
    hoverBg: 'rgba(63, 58, 52, 0.14)',
  },
];

export const getEventColorPreset = (colorId?: string | null): EventColorPreset => {
  return (
    EVENT_COLOR_PRESETS.find((c) => c.id === colorId) || EVENT_COLOR_PRESETS[0]
  );
};
