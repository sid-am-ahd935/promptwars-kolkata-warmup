/**
 * Budget Optimizer Engine
 * Recursive substitution logic with dual budget constraints.
 * Returns suggestions only — never auto-applies.
 */

/**
 * Build an ingredient lookup map from the ingredients catalog.
 * @param {object[]} ingredientsCatalog - Full ingredients array
 * @returns {Map<string, object>} ingredientId -> ingredient object
 */
export function buildIngredientMap(ingredientsCatalog) {
  const map = new Map();
  for (const ing of ingredientsCatalog) {
    map.set(ing.id, ing);
  }
  return map;
}

/**
 * Aggregate ingredients across a day's recipes, merging quantities for
 * duplicate ingredients.
 *
 * @param {object[]} dayRecipes - Array of recipe objects assigned to a day
 * @param {Map<string, object>} ingredientMap - Ingredient lookup map
 * @param {object} appliedSubs - Map of ingredientId -> substituteIngredientId (already accepted swaps)
 * @returns {{ ingredientId: string, name: string, totalQuantity: number, unit: string, unitPrice: number, totalCost: number }[]}
 */
export function aggregateGroceryList(dayRecipes, ingredientMap, appliedSubs = {}) {
  const aggregated = new Map();

  for (const recipe of dayRecipes) {
    for (const ri of recipe.ingredients) {
      // Check if this ingredient has an accepted substitution
      let effectiveId = ri.ingredientId;
      if (appliedSubs[ri.ingredientId]) {
        effectiveId = appliedSubs[ri.ingredientId];
      }

      const ingredient = ingredientMap.get(effectiveId);
      if (!ingredient) continue;

      if (aggregated.has(effectiveId)) {
        const existing = aggregated.get(effectiveId);
        existing.totalQuantity += ri.quantity;
        existing.totalCost = parseFloat((existing.totalQuantity * existing.unitPrice).toFixed(2));
      } else {
        const unitPrice = ingredient.pricePerUnit;
        aggregated.set(effectiveId, {
          ingredientId: effectiveId,
          originalId: ri.ingredientId !== effectiveId ? ri.ingredientId : null,
          name: ingredient.name,
          totalQuantity: ri.quantity,
          unit: ingredient.unit,
          unitPrice,
          totalCost: parseFloat((ri.quantity * unitPrice).toFixed(2)),
        });
      }
    }
  }

  return Array.from(aggregated.values()).sort((a, b) => b.totalCost - a.totalCost);
}

/**
 * Aggregate grocery list across ALL days in the meal plan.
 *
 * @param {object} mealPlan - The full meal plan object { dayIndex: { Breakfast, Lunch, Dinner } }
 * @param {object[]} allRecipes - Full recipe catalog
 * @param {Map<string, object>} ingredientMap - Ingredient lookup
 * @param {object} allAppliedSubs - { dayIndex: { ingredientId: substituteId } }
 * @param {number} numDays - Number of active days
 * @returns {{ ingredientId, name, totalQuantity, unit, unitPrice, totalCost }[]}
 */
export function aggregateFullGroceryList(mealPlan, allRecipes, ingredientMap, allAppliedSubs = {}, numDays = 7) {
  const aggregated = new Map();
  const recipeMap = new Map(allRecipes.map((r) => [r.id, r]));

  for (let day = 0; day < numDays; day++) {
    const daySlots = mealPlan[day] || {};
    const daySubs = allAppliedSubs[day] || {};

    for (const category of ['Breakfast', 'Lunch', 'Dinner']) {
      const recipeId = daySlots[category];
      if (!recipeId) continue;

      const recipe = recipeMap.get(recipeId);
      if (!recipe) continue;

      for (const ri of recipe.ingredients) {
        let effectiveId = ri.ingredientId;
        if (daySubs[ri.ingredientId]) {
          effectiveId = daySubs[ri.ingredientId];
        }

        const ingredient = ingredientMap.get(effectiveId);
        if (!ingredient) continue;

        if (aggregated.has(effectiveId)) {
          const existing = aggregated.get(effectiveId);
          existing.totalQuantity += ri.quantity;
          existing.totalCost = parseFloat((existing.totalQuantity * existing.unitPrice).toFixed(2));
        } else {
          aggregated.set(effectiveId, {
            ingredientId: effectiveId,
            originalId: ri.ingredientId !== effectiveId ? ri.ingredientId : null,
            name: ingredient.name,
            totalQuantity: ri.quantity,
            unit: ingredient.unit,
            unitPrice: ingredient.pricePerUnit,
            totalCost: parseFloat((ri.quantity * ingredient.pricePerUnit).toFixed(2)),
          });
        }
      }
    }
  }

  return Array.from(aggregated.values()).sort((a, b) => b.totalCost - a.totalCost);
}

/**
 * Calculate total cost from a grocery list.
 * @param {{ totalCost: number }[]} groceryList
 * @returns {number}
 */
export function calculateTotalCost(groceryList) {
  return parseFloat(groceryList.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2));
}

/**
 * Calculate cost for a single day.
 */
export function calculateDayCost(dayRecipes, ingredientMap, appliedSubs = {}) {
  const list = aggregateGroceryList(dayRecipes, ingredientMap, appliedSubs);
  return calculateTotalCost(list);
}

/**
 * Recursive budget optimizer.
 *
 * Algorithm:
 * 1. Compute total cost of the aggregated grocery list
 * 2. If within BOTH daily and total budget constraints → return as-is
 * 3. Find the highest-cost ingredient that has unused substitutes
 * 4. Generate a swap suggestion (original → cheapest substitute)
 * 5. Recurse with the swap tentatively applied
 * 6. Stop when budget is met OR no more substitutes exist
 *
 * IMPORTANT: Returns suggestions only — does NOT auto-apply.
 *
 * @param {object[]} dayRecipes - Recipes for the day
 * @param {Map<string, object>} ingredientMap - Ingredient lookup
 * @param {number} dailyBudget - Per-day budget limit (₹)
 * @param {number} totalBudgetRemaining - Remaining total budget for the plan (₹)
 * @param {object} currentSubs - Already applied substitutions { ingredientId: substituteId }
 * @param {Set<string>} triedSwaps - Set of "originalId->subId" strings already tried
 * @param {number} depth - Current recursion depth (safety limit)
 * @returns {{ suggestions: object[], budgetMet: boolean, projectedCost: number }}
 */
export function optimizeBudget(
  dayRecipes,
  ingredientMap,
  dailyBudget,
  totalBudgetRemaining,
  currentSubs = {},
  triedSwaps = new Set(),
  depth = 0
) {
  const MAX_DEPTH = 50;

  // Compute current cost with applied subs
  const groceryList = aggregateGroceryList(dayRecipes, ingredientMap, currentSubs);
  const currentCost = calculateTotalCost(groceryList);

  // Budget constraint: must satisfy BOTH daily and remaining total
  const effectiveBudget = Math.min(dailyBudget, totalBudgetRemaining);

  if (currentCost <= effectiveBudget || depth >= MAX_DEPTH) {
    return {
      suggestions: [],
      budgetMet: currentCost <= effectiveBudget,
      projectedCost: currentCost,
    };
  }

  // Find the highest-cost ingredient with available substitutes
  for (const item of groceryList) {
    const effectiveId = item.ingredientId;
    const ingredient = ingredientMap.get(effectiveId);
    if (!ingredient || !ingredient.substitutes || ingredient.substitutes.length === 0) continue;

    // Find the cheapest substitute not yet tried
    const availableSubs = ingredient.substitutes
      .filter((sub) => {
        const swapKey = `${effectiveId}->${sub.ingredientId}`;
        return !triedSwaps.has(swapKey);
      })
      .sort((a, b) => a.pricePerUnit - b.pricePerUnit);

    if (availableSubs.length === 0) continue;

    const bestSub = availableSubs[0];
    const swapKey = `${effectiveId}->${bestSub.ingredientId}`;
    const savings = parseFloat(
      (item.totalQuantity * (item.unitPrice - bestSub.pricePerUnit)).toFixed(2)
    );

    // Only suggest if it actually saves money
    if (savings <= 0) continue;

    // Tentatively apply this swap and recurse
    const newSubs = { ...currentSubs };
    // Map original ingredient ID to new substitute
    const originalId = item.originalId || effectiveId;
    newSubs[originalId] = bestSub.ingredientId;

    const newTriedSwaps = new Set(triedSwaps);
    newTriedSwaps.add(swapKey);

    const recursiveResult = optimizeBudget(
      dayRecipes,
      ingredientMap,
      dailyBudget,
      totalBudgetRemaining,
      newSubs,
      newTriedSwaps,
      depth + 1
    );

    return {
      suggestions: [
        {
          originalId: effectiveId,
          originalName: ingredient.name,
          substituteId: bestSub.ingredientId,
          substituteName: bestSub.name,
          originalUnitPrice: item.unitPrice,
          substituteUnitPrice: bestSub.pricePerUnit,
          quantity: item.totalQuantity,
          unit: item.unit,
          savings,
        },
        ...recursiveResult.suggestions,
      ],
      budgetMet: recursiveResult.budgetMet,
      projectedCost: recursiveResult.projectedCost,
    };
  }

  // No more substitutes available
  return {
    suggestions: [],
    budgetMet: false,
    projectedCost: currentCost,
  };
}
