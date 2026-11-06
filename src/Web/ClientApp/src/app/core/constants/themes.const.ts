/**
 * ══════════════════════════════════════════════════════════════
 * THEME MATRIX & CONSTANTS — Syrian Heritage Design System
 * 6 Theme Families × 2 Modes (Light / Dark) = 12 Themes
 * ══════════════════════════════════════════════════════════════
 */

export type ThemeMode = 'light' | 'dark';

export type ThemeFamilyId =
  | 'emerald-luxury'
  | 'royal-heritage'
  | 'forest-glass'
  | 'executive-premium'
  | 'heritage-luxury'
  | 'syrian-identity';

export type ThemeId = `${ThemeFamilyId}-${ThemeMode}`;

export interface ThemeDefinition {
  id: ThemeId;
  family: ThemeFamilyId;
  mode: ThemeMode;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  primaryColor: string;
  surfaceColor: string;
  accentColor: string;
}

export const DEFAULT_THEME_FAMILY: ThemeFamilyId = 'emerald-luxury';
export const DEFAULT_LIGHT_THEME: ThemeId = 'emerald-luxury-light';
export const DEFAULT_DARK_THEME: ThemeId = 'emerald-luxury-dark';

export const THEMES_REGISTRY: Record<ThemeId, ThemeDefinition> = {
  // 1. Aleppo Emerald Luxury (الزمرد الحلبي الفاخر)
  'emerald-luxury-light': {
    id: 'emerald-luxury-light',
    family: 'emerald-luxury',
    mode: 'light',
    nameAr: 'الزمرد الحلبي (نهاري)',
    nameEn: 'Aleppo Emerald Luxury (Light)',
    descriptionAr: 'عاج دافئ، ذهب الشام، وخضرة الصنوبر الحلبي العريق',
    primaryColor: '#c79c4a',
    surfaceColor: '#faf8f3',
    accentColor: '#3e6b5b'
  },
  'emerald-luxury-dark': {
    id: 'emerald-luxury-dark',
    family: 'emerald-luxury',
    mode: 'dark',
    nameAr: 'الزمرد الحلبي (ليلي فاخر)',
    nameEn: 'Aleppo Emerald Luxury (Dark)',
    descriptionAr: 'فحم حلب الأندلسي، وهج الذهب المعتق، ولمسات الصنوبر',
    primaryColor: '#e4cc96',
    surfaceColor: '#141310',
    accentColor: '#428177'
  },

  // 2. Royal Damascus Heritage (التراث الملكي الدمشقي)
  'royal-heritage-light': {
    id: 'royal-heritage-light',
    family: 'royal-heritage',
    mode: 'light',
    nameAr: 'التراث الملكي (نهاري)',
    nameEn: 'Royal Heritage (Light)',
    descriptionAr: 'عنابي القلعة التاريخية مع لمسات الذهب الأثري',
    primaryColor: '#6b1f2a',
    surfaceColor: '#fbf7f7',
    accentColor: '#c79c4a'
  },
  'royal-heritage-dark': {
    id: 'royal-heritage-dark',
    family: 'royal-heritage',
    mode: 'dark',
    nameAr: 'التراث الملكي (ليلي فاخر)',
    nameEn: 'Royal Heritage (Dark)',
    descriptionAr: 'أحمر دمشقي ملكي غائر في ظلال القلعة والذهب',
    primaryColor: '#d97787',
    surfaceColor: '#180c0e',
    accentColor: '#e4cc96'
  },

  // 3. Cedar Forest Glass (غابات الأرز والزجاج)
  'forest-glass-light': {
    id: 'forest-glass-light',
    family: 'forest-glass',
    mode: 'light',
    nameAr: 'غابات الأرز (نهاري)',
    nameEn: 'Cedar Forest Glass (Light)',
    descriptionAr: 'طبيعة جبال الشام النقية ولمسات الزجاج المصقول',
    primaryColor: '#266655',
    surfaceColor: '#f4f8f6',
    accentColor: '#c79c4a'
  },
  'forest-glass-dark': {
    id: 'forest-glass-dark',
    family: 'forest-glass',
    mode: 'dark',
    nameAr: 'غابات الأرز (ليلي فاخر)',
    nameEn: 'Cedar Forest Glass (Dark)',
    descriptionAr: 'أعماق الغابات الليلية مع بريق أخضر زمردي ساحر',
    primaryColor: '#52b399',
    surfaceColor: '#0a1814',
    accentColor: '#e4cc96'
  },

  // 4. Modern Executive Premium (المكتب التنفيذي الحديث)
  'executive-premium-light': {
    id: 'executive-premium-light',
    family: 'executive-premium',
    mode: 'light',
    nameAr: 'التنفيذي الحديث (نهاري)',
    nameEn: 'Executive Premium (Light)',
    descriptionAr: 'أناقة رجال الأعمال بظلال كحلية فارهة وذهب شامبانيا',
    primaryColor: '#1c2b4b',
    surfaceColor: '#f4f6fb',
    accentColor: '#c79c4a'
  },
  'executive-premium-dark': {
    id: 'executive-premium-dark',
    family: 'executive-premium',
    mode: 'dark',
    nameAr: 'التنفيذي الحديث (ليلي فاخر)',
    nameEn: 'Executive Premium (Dark)',
    descriptionAr: 'كحلي ليلي عميق مع تفاصيل ذهبية براقة عالية التباين',
    primaryColor: '#81a1de',
    surfaceColor: '#0c1424',
    accentColor: '#e4cc96'
  },

  // 5. Aleppo Stone Heritage (حجر حلب الذهبي)
  'heritage-luxury-light': {
    id: 'heritage-luxury-light',
    family: 'heritage-luxury',
    mode: 'light',
    nameAr: 'حجر حلب الذهبي (نهاري)',
    nameEn: 'Aleppo Stone Heritage (Light)',
    descriptionAr: 'دفء حجارة بيوت حلب القديمة وسنابل قمح الشمال',
    primaryColor: '#ae8136',
    surfaceColor: '#faf7f0',
    accentColor: '#5a411f'
  },
  'heritage-luxury-dark': {
    id: 'heritage-luxury-dark',
    family: 'heritage-luxury',
    mode: 'dark',
    nameAr: 'حجر حلب الذهبي (ليلي فاخر)',
    nameEn: 'Aleppo Stone Heritage (Dark)',
    descriptionAr: 'حجارة حلب تحت ضوء القمر بوهج عنبري أثيل',
    primaryColor: '#ebc37f',
    surfaceColor: '#18140d',
    accentColor: '#f7efde'
  },

  // 6. Syrian Identity Heritage (الهوية السورية الخالدة)
  'syrian-identity-light': {
    id: 'syrian-identity-light',
    family: 'syrian-identity',
    mode: 'light',
    nameAr: 'الهوية السورية (نهاري)',
    nameEn: 'Syrian Identity (Light)',
    descriptionAr: 'ألوان سورية الأصيلة: الأخضر الغض، الأحمر القرمزي والذهب',
    primaryColor: '#1f6b4a',
    surfaceColor: '#faf9f5',
    accentColor: '#b82832'
  },
  'syrian-identity-dark': {
    id: 'syrian-identity-dark',
    family: 'syrian-identity',
    mode: 'dark',
    nameAr: 'الهوية السورية (ليلي فاخر)',
    nameEn: 'Syrian Identity (Dark)',
    descriptionAr: 'طيف الهوية السورية في لوحة داكنة سينمائية متناسقة',
    primaryColor: '#4abd89',
    surfaceColor: '#0f1914',
    accentColor: '#e8626d'
  }
};

export function resolveThemeId(family: ThemeFamilyId, mode: ThemeMode): ThemeId {
  return `${family}-${mode}`;
}

export function getThemeDefinition(id: ThemeId): ThemeDefinition {
  return THEMES_REGISTRY[id] ?? THEMES_REGISTRY[DEFAULT_LIGHT_THEME];
}
