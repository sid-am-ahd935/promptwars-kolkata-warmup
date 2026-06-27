import { useState } from 'react';
import { useMealPlan, ActionTypes } from '../context/MealPlanContext';
import RecipePicker from './RecipePicker';
import './MealSlot.css';

export default function MealSlot({ day, category }) {
  const { state, dispatch, recipeMap } = useMealPlan();
  const [showPicker, setShowPicker] = useState(false);

  const recipeId = state.mealPlan[day]?.[category];
  const recipe = recipeId ? recipeMap.get(recipeId) : null;

  const categoryClass = category.toLowerCase();

  const handleClick = () => {
    if (recipe) {
      dispatch({
        type: ActionTypes.SELECT_RECIPE,
        payload: { recipeId: recipe.id },
      });
    } else {
      setShowPicker(true);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    dispatch({
      type: ActionTypes.REMOVE_RECIPE,
      payload: { day, category },
    });
    // Clear selection if this was the selected recipe
    if (state.selectedRecipeId === recipeId) {
      dispatch({
        type: ActionTypes.SELECT_RECIPE,
        payload: { recipeId: null },
      });
    }
  };

  return (
    <>
      <div
        className={`meal-slot ${recipe ? 'meal-slot-filled' : 'meal-slot-empty'} ${categoryClass}`}
        onClick={handleClick}
        title={recipe ? `Click to view recommendations for ${recipe.title}` : `Add ${category}`}
      >
        {recipe ? (
          <>
            <div className="meal-slot-header">
              <div className={`category-indicator ${categoryClass}`} />
              <span className="meal-slot-title">{recipe.title}</span>
              <button
                className="meal-slot-remove"
                onClick={handleRemove}
                title="Remove recipe"
              >
                ×
              </button>
            </div>
            <div className="meal-slot-footer">
              <div className="meal-slot-tags">
                {recipe.tags.slice(0, 2).map((t) => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </div>
              <span className="price price-neutral meal-slot-cost">
                ₹{recipe.baseCost}
              </span>
            </div>
          </>
        ) : (
          <div className="meal-slot-placeholder">
            <span className="meal-slot-plus">+</span>
            <span className="meal-slot-label">{category}</span>
          </div>
        )}
      </div>

      {showPicker && (
        <RecipePicker
          day={day}
          category={category}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
