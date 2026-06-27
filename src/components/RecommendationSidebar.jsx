import { useMemo, useState } from 'react';
import { useMealPlan, ActionTypes } from '../context/MealPlanContext';
import { getRecommendations } from '../engine/jaccard';
import './RecommendationSidebar.css';

export default function RecommendationSidebar() {
  const { state, dispatch, recipes } = useMealPlan();
  const { selectedRecipeId, mealPlan, numDays } = state;
  const [quickAddTarget, setQuickAddTarget] = useState(null); // { recipeId }

  const selectedRecipe = selectedRecipeId
    ? recipes.find((r) => r.id === selectedRecipeId)
    : null;

  // Collect all assigned recipe IDs to exclude from recommendations
  const assignedIds = useMemo(() => {
    const ids = new Set();
    for (let d = 0; d < numDays; d++) {
      const daySlots = mealPlan[d] || {};
      for (const cat of ['Breakfast', 'Lunch', 'Dinner']) {
        if (daySlots[cat]) ids.add(daySlots[cat]);
      }
    }
    return ids;
  }, [mealPlan, numDays]);

  const recommendations = useMemo(() => {
    if (!selectedRecipeId) return [];
    return getRecommendations(selectedRecipeId, recipes, assignedIds, 3);
  }, [selectedRecipeId, recipes, assignedIds]);

  // Find available slots for quick-add
  const getAvailableSlots = (category) => {
    const slots = [];
    for (let d = 0; d < numDays; d++) {
      if (!mealPlan[d]?.[category]) {
        slots.push({ day: d, category });
      }
    }
    return slots;
  };

  const handleQuickAdd = (recipeId, day, category) => {
    dispatch({
      type: ActionTypes.ASSIGN_RECIPE,
      payload: { day, category, recipeId },
    });
    setQuickAddTarget(null);
  };

  return (
    <div className="sidebar glass-card-static slide-in-right">
      <div className="sidebar-header">
        <span className="sidebar-icon">✨</span>
        <h3 className="sidebar-title">Recommendations</h3>
      </div>

      {!selectedRecipe ? (
        <div className="sidebar-empty">
          <div className="sidebar-empty-icon">🔍</div>
          <p>Select a recipe from the grid to see similar suggestions</p>
        </div>
      ) : (
        <>
          <div className="sidebar-selected">
            <span className="sidebar-selected-label">Selected</span>
            <div className="sidebar-selected-card">
              <span className="sidebar-selected-title">
                {selectedRecipe.title}
              </span>
              <div className="sidebar-selected-tags">
                {selectedRecipe.tags.map((t) => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="sidebar-divider" />

          <div className="sidebar-results">
            <span className="sidebar-results-label">
              Top {recommendations.length} Similar
            </span>

            {recommendations.length === 0 ? (
              <div className="sidebar-no-results">
                No similar recipes available
              </div>
            ) : (
              recommendations.map(({ recipe, score }) => (
                <div key={recipe.id} className="rec-card">
                  <div className="rec-card-header">
                    <span className="rec-card-title">{recipe.title}</span>
                    <span className="badge badge-violet rec-card-score">
                      {Math.round(score * 100)}%
                    </span>
                  </div>
                  <div className="rec-card-meta">
                    <span className="rec-card-category badge badge-amber">
                      {recipe.category}
                    </span>
                    <span className="price price-neutral">
                      ₹{recipe.baseCost}
                    </span>
                  </div>
                  <div className="rec-card-tags">
                    {recipe.tags.slice(0, 3).map((t) => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>

                  {quickAddTarget === recipe.id ? (
                    <div className="rec-quick-add-slots">
                      <span className="rec-quick-add-label">Add to:</span>
                      {getAvailableSlots(recipe.category).length === 0 ? (
                        <span className="rec-no-slots">No empty {recipe.category} slots</span>
                      ) : (
                        <div className="rec-slot-buttons">
                          {getAvailableSlots(recipe.category).map(({ day, category }) => (
                            <button
                              key={`${day}-${category}`}
                              className="btn btn-sm btn-ghost"
                              onClick={() => handleQuickAdd(recipe.id, day, category)}
                            >
                              Day {day + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      className="btn btn-sm btn-primary rec-quick-add-btn"
                      onClick={() => setQuickAddTarget(recipe.id)}
                    >
                      ⚡ Quick Add
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
