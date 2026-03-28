export const FOOD_ROLES = [
    { value: 'soup', label: 'Çorba' },
    { value: 'mainDish', label: 'Ana Yemek' },
    { value: 'salad', label: 'Salata' },
    { value: 'sideDish', label: 'Yan Yemek' },
    { value: 'bread', label: 'Ekmek' },
    { value: 'dessert', label: 'Tatlı' },
    { value: 'snack', label: 'Atıştırmalık / Kuruyemiş' },
    { value: 'drink', label: 'İçecek' },
    { value: 'fruit', label: 'Meyve' },
    { value: 'supplement', label: 'Ek' }
] as const;

export const ROLE_LABELS: Record<string, string> = FOOD_ROLES.reduce((acc, role) => {
    acc[role.value] = role.label;
    return acc;
}, {} as Record<string, string>);

// Deprecated or legacy mappings to ensure they display correctly if they exist in DB
export const LEGACY_ROLE_LABELS: Record<string, string> = {
    'corba': 'Çorba (Eski)',
    ...ROLE_LABELS
};
