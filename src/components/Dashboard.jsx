import { useMemo } from 'react';
import { useMealPlan } from '../context/MealPlanContext';
import { calculateDayCost, aggregateGroceryList } from '../engine/budgetOptimizer';
import MealSlot from './MealSlot';
import './Dashboard.css';

export default function Dashboard() {
  const { state, recipeMap, ingredientMap } = useMealPlan();
  const { numDays, mealPlan, dailyBudget, appliedSubstitutions } = state;

  const days = Array.from({ length: numDays }, (_, i) => i);
  const categories = ['Breakfast', 'Lunch', 'Dinner'];
  const categoryEmoji = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙' };

  // Compute per-day costs
  const dayCosts = useMemo(() => {
    return days.map((day) => {
      const daySlots = mealPlan[day] || {};
      const dayRecipes = categories
        .map((cat) => daySlots[cat])
        .filter(Boolean)
        .map((id) => recipeMap.get(id))
        .filter(Boolean);

      if (dayRecipes.length === 0) return 0;
      const daySubs = appliedSubstitutions[day] || {};
      return calculateDayCost(dayRecipes, ingredientMap, daySubs);
    });
  }, [mealPlan, numDays, appliedSubstitutions]);

  return (
    <div className="dashboard">
      <div className="section-header">
        <span className="section-icon">📋</span>
        <h2>Meal Plan</h2>
        <span className="dashboard-day-count badge badge-violet">
          {numDays} {numDays === 1 ? 'day' : 'days'}
        </span>
      </div>

      <div className="dashboard-grid-wrapper">
        <div className="dashboard-grid" style={{ '--num-days': numDays }}>
          {/* Column Headers (Day numbers) */}
          <div className="grid-corner" />
          {days.map((day) => {
            const cost = dayCosts[day];
            const isOver = cost > dailyBudget && cost > 0;
            return (
              <div key={`header-${day}`} className="grid-day-header">
                <span className="grid-day-label">Day {day + 1}</span>
                {cost > 0 && (
                  <span
                    className={`price grid-day-cost ${
                      isOver ? 'price-negative' : 'price-positive'
                    }`}
                  >
                    ₹{cost.toFixed(0)}
                  </span>
                )}
              </div>
            );
          })}

          {/* Row for each category */}
          {categories.map((category) => (
            <>
              <div
                key={`label-${category}`}
                className={`grid-category-label ${category.toLowerCase()}`}
              >
                <span className="category-emoji">
                  {categoryEmoji[category]}
                </span>
                <span>{category}</span>
              </div>
              {days.map((day) => (
                <div key={`slot-${day}-${category}`} className="grid-cell">
                  <MealSlot day={day} category={category} />
                </div>
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
