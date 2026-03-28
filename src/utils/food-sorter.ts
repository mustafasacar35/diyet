export function getRoleIndex(role?: string | null): number {
    if (!role) return 999;
    const lowerRole = role.toLowerCase().trim();

    // 1. Çorba
    if (lowerRole.includes('çorba') || lowerRole.includes('corba') || lowerRole.includes('soup')) return 1;
    // 2. Ana yemek
    if (lowerRole.includes('ana yemek') || lowerRole.includes('anayemek') || lowerRole.includes('main')) return 2;
    // 3. Yan yemek
    if (lowerRole.includes('yan yemek') || lowerRole.includes('yanyemek') || lowerRole.includes('side')) return 3;
    // 4. Salata
    if (lowerRole.includes('salata') || lowerRole.includes('salad')) return 4;
    // 5. Ekmek
    if (lowerRole.includes('ekmek') || lowerRole.includes('bread')) return 5;
    // 6. Atıştırmalık / kuruyemiş
    if (lowerRole.includes('atıştırmalık') || lowerRole.includes('atistirmalik') || lowerRole.includes('kuruyemiş') || lowerRole.includes('kuruyemis') || lowerRole.includes('snack') || lowerRole.includes('nut')) return 6;
    // 7. Tatlı
    if (lowerRole.includes('tatlı') || lowerRole.includes('tatli') || lowerRole.includes('dessert')) return 7;
    // 8. Meyve
    if (lowerRole.includes('meyve') || lowerRole.includes('fruit')) return 8;
    // 9. İçecek
    if (lowerRole.includes('içecek') || lowerRole.includes('icecek') || lowerRole.includes('beverage') || lowerRole.includes('drink')) return 9;
    // 10. Ek
    if (lowerRole.includes('ek') || lowerRole.includes('addition') || lowerRole.includes('extra')) return 10;

    return 999; // Unknown role at the bottom
}

export function sortFoodsByRole<T>(foods: T[], getRoleName: (food: T) => string | undefined | null): T[] {
    return [...foods].sort((a, b) => {
        const roleA = getRoleName(a);
        const roleB = getRoleName(b);
        return getRoleIndex(roleA) - getRoleIndex(roleB);
    });
}
