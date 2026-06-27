/**
 * Jaccard Similarity Engine
 * Pure functions for deterministic recipe recommendations.
 * No side effects, no external dependencies.
 */

/**
 * Compute Jaccard index: |A ∩ B| / |A ∪ B|
 * @param {string[]} tagsA - First tag set
 * @param {string[]} tagsB - Second tag set
 * @returns {number} Similarity score between 0 and 1
 */
export function jaccardIndex(tagsA, tagsB) {
  if (!tagsA.length && !tagsB.length) return 0;

  const setA = new Set(tagsA);
  const setB = new Set(tagsB);

  let intersectionSize = 0;
  for (const tag of setA) {
    if (setB.has(tag)) intersectionSize++;
  }

  const unionSize = new Set([...tagsA, ...tagsB]).size;

  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

/**
 * Return top-N similar recipes based on Jaccard similarity.
 * Excludes the selected recipe itself and any already-assigned recipes.
 *
 * @param {string} recipeId - Currently selected recipe ID
 * @param {object[]} allRecipes - Full recipe catalog
 * @param {Set<string>} excludeIds - Recipe IDs to exclude (already assigned)
 * @param {number} topN - Number of results to return (default: 3)
 * @returns {{ recipe: object, score: number }[]} Sorted descending by score
 */
export function getRecommendations(recipeId, allRecipes, excludeIds = new Set(), topN = 3) {
  const selectedRecipe = allRecipes.find((r) => r.id === recipeId);
  if (!selectedRecipe) return [];

  const scores = allRecipes
    .filter((r) => r.id !== recipeId && !excludeIds.has(r.id))
    .map((r) => ({
      recipe: r,
      score: jaccardIndex(selectedRecipe.tags, r.tags),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scores.slice(0, topN);
}
