import { useState } from 'react';
import { useMealPlan, ActionTypes } from '../context/MealPlanContext';
import './RecipePicker.css';

export default function RecipePicker({ day, category, onClose }) {
  const { recipes, dispatch } = useMealPlan();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Filter by category
  const categoryRecipes = recipes.filter((r) => r.category === category);

  // All unique tags in this category
  const allTags = [...new Set(categoryRecipes.flatMap((r) => r.tags))].sort();

  // Apply search and tag filters
  const filtered = categoryRecipes.filter((r) => {
    const matchesSearch =
      !search || r.title.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !selectedTag || r.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleSelect = (recipeId) => {
    dispatch({
      type: ActionTypes.ASSIGN_RECIPE,
      payload: { day, category, recipeId },
    });
    onClose();
  };

  const categoryColor =
    category === 'Breakfast'
      ? 'var(--breakfast-color)'
      : category === 'Lunch'
      ? 'var(--lunch-color)'
      : 'var(--dinner-color)';

  return (
    <div className="picker-overlay fade-in" onClick={onClose}>
      <div
        className="picker-modal glass-card scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="picker-header">
          <div className="picker-header-title">
            <span
              className="picker-category-dot"
              style={{ background: categoryColor }}
            />
            <h3>
              Choose {category} — Day {day + 1}
            </h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="picker-filters">
          <input
            type="text"
            className="input picker-search"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="picker-tags">
            <button
              className={`tag ${!selectedTag ? 'tag-active' : ''}`}
              onClick={() => setSelectedTag('')}
            >
              All
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                className={`tag ${selectedTag === t ? 'tag-active' : ''}`}
                onClick={() => setSelectedTag(selectedTag === t ? '' : t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="picker-list">
          {filtered.length === 0 ? (
            <div className="picker-empty">No recipes match your filters</div>
          ) : (
            filtered.map((recipe) => (
              <button
                key={recipe.id}
                className="picker-recipe-card"
                onClick={() => handleSelect(recipe.id)}
              >
                <div className="picker-recipe-info">
                  <span className="picker-recipe-title">{recipe.title}</span>
                  <div className="picker-recipe-tags">
                    {recipe.tags.slice(0, 3).map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="price price-neutral">
                  ₹{recipe.baseCost}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
