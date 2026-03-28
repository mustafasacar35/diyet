
export const FOOD_CATEGORIES = [
    'KAHVALTI',
    'ÖĞLEN',
    'AKŞAM',
    'ARA ÖĞÜN',
    'SALATALAR',
    'MEZELER',
    'ÇORBALAR',
    'EKMEKLER',
    'MEYVELER',
    'KURUYEMİŞLER',
    'TATLILAR',
    'İÇECEKLER',
    'KOLLAJEN',
    'TOSTLAR',
    'ATIŞTIRMALIKLAR',
    'GENEL',
    'DİĞER',
] as const;

export type FoodCategory = typeof FOOD_CATEGORIES[number];
