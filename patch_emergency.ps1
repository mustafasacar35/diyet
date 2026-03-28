$content = [System.IO.File]::ReadAllText('src\lib\planner\engine.ts', [System.Text.Encoding]::UTF8)

$oldBlock = "        if (selectedFoods.length < config.minItems) {
            const emergencyRoles = ['sideDish', 'salad', 'soup', 'bread', 'drink', 'fruit', 'snack', 'dessert']
            let guard = 0
            while (selectedFoods.length < config.minItems && guard < 16) {
                guard++
                let added = false
                for (const emergencyRole of emergencyRoles) {
                    const emergencyRoleNorm = this.getCanonicalLockRole(emergencyRole || '')
                    if (emergencyRoleNorm && UNIQUE_SLOT_ROLES.has(emergencyRoleNorm) && selectedRoles.has(emergencyRoleNorm)) {
                        continue
                    }

                    // If we've tried all options once (guard > length), drop tag conflict rules to guarantee fill
                    const effectiveSlotTags = guard > emergencyRoles.length ? new Set<string>() : slotTags;

                    const emergencyFood = await this.selectBestFoodByRole(
                        category,
                        emergencyRole,
                        context,
                        selectedIds,
                        effectiveSlotTags,
                        context.slotMainDish,
                        99999,
                        true,
                        true,
                        true,
                        true
                    )
                    if (!emergencyFood) continue

                    const foodRole = this.getCanonicalLockRole(emergencyFood.role || '')
                    if (foodRole && UNIQUE_SLOT_ROLES.has(foodRole) && selectedRoles.has(foodRole)) continue

                    selectedFoods.push(emergencyFood)
                    selectedIds.add(emergencyFood.id)
                    this.addFoodMacros(slotMacros, emergencyFood)
                    this.addFoodTags(slotTags, emergencyFood)
                    if (foodRole) {
                        selectedRoles.add(foodRole)
                        if (foodRole === 'maindish' && !context.slotMainDish) {
                            context.slotMainDish = emergencyFood
                        }
                    }
                    selectedFoods[selectedFoods.length - 1].source = this.decorateSourceWithLockMetadata(emergencyFood, {
                        type: 'required_role',
                        rule: 'Min Öğün Satırı'
                    })
                    this.log(context.dayIndex + 1, slotName, 'select', \Emergency minItems fill\, emergencyFood.name)
                    added = true
                    break
                }
                if (!added && guard > emergencyRoles.length) break
            }
        }"

$newBlock = "        if (selectedFoods.length < config.minItems) {
            const emergencyRoles = ['sideDish', 'salad', 'soup', 'bread', 'drink', 'fruit', 'snack', 'dessert']
            let dropTags = false;
            let guard = 0;
            while (selectedFoods.length < config.minItems && guard < 16) {
                guard++;
                let added = false;
                for (const emergencyRole of emergencyRoles) {
                    const emergencyRoleNorm = this.getCanonicalLockRole(emergencyRole || '');
                    if (emergencyRoleNorm && UNIQUE_SLOT_ROLES.has(emergencyRoleNorm) && selectedRoles.has(emergencyRoleNorm)) continue;

                    const effectiveSlotTags = dropTags ? new Set<string>() : slotTags;
                    const emergencyFood = await this.selectBestFoodByRole(
                        category, emergencyRole, context, selectedIds, effectiveSlotTags, context.slotMainDish,
                        99999, true, true, true, true
                    );
                    
                    if (!emergencyFood) continue;

                    const foodRole = this.getCanonicalLockRole(emergencyFood.role || '');
                    if (foodRole && UNIQUE_SLOT_ROLES.has(foodRole) && selectedRoles.has(foodRole)) continue;

                    selectedFoods.push(emergencyFood);
                    selectedIds.add(emergencyFood.id);
                    this.addFoodMacros(slotMacros, emergencyFood);
                    this.addFoodTags(slotTags, emergencyFood);
                    if (foodRole) {
                        selectedRoles.add(foodRole);
                        if (foodRole === 'maindish' && !context.slotMainDish) context.slotMainDish = emergencyFood;
                    }
                    selectedFoods[selectedFoods.length - 1].source = this.decorateSourceWithLockMetadata(emergencyFood, { type: 'required_role', rule: 'Min Öğün Satırı' });
                    this.log(context.dayIndex + 1, slotName, 'select', \\Emergency minItems fill\\, emergencyFood.name);
                    added = true;
                    break;
                }
                
                if (!added) {
                    if (!dropTags) {
                        dropTags = true;
                    } else {
                        // EXTREME FALLBACK: Pick any random food that is not a maindish and not yet selected
                        const fallbackFood = this.allFoods.find((f: any) => !selectedIds.has(f.id) && f.role !== 'mainDish' && f.role !== 'breakfast_main');
                        if (fallbackFood) {
                            selectedFoods.push(fallbackFood);
                            selectedIds.add(fallbackFood.id);
                            this.addFoodMacros(slotMacros, fallbackFood);
                            this.addFoodTags(slotTags, fallbackFood);
                            selectedFoods[selectedFoods.length - 1].source = { type: 'required_role', rule: 'Min Öğün Satırı (Last Resort)' };
                            this.log(context.dayIndex + 1, slotName, 'select', \\Last resort minItems fill\\, fallbackFood.name);
                            added = true;
                        } else {
                           break; // Absolutely out of foods
                        }
                    }
                }
            }
        }"

if ($content.Contains($oldBlock)) {
    $content = $content.Replace($oldBlock, $newBlock)
    [System.IO.File]::WriteAllText('src\lib\planner\engine.ts', $content, [System.Text.Encoding]::UTF8)
    Write-Host "Replaced successfully"
} else {
    Write-Host "Old block not found"
}
