import { useMemo, useEffect } from 'react';
import { useMealPlan, ActionTypes } from '../context/MealPlanContext';
import {
  aggregateGroceryList,
  calculateTotalCost,
  calculateDayCost,
  optimizeBudget,
} from '../engine/budgetOptimizer';
import BudgetWarning from './BudgetWarning';
import './BudgetPanel.css';

export default function BudgetPanel() {
  const { state, dispatch, recipes, recipeMap, ingredientMap } = useMealPlan();
  const {
    mealPlan,
    numDays,
    dailyBudget,
    totalBudget,
    substitutions,
    appliedSubstitutions,
  } = state;

  const categories = ['Breakfast', 'Lunch', 'Dinner'];

  // Compute per-day costs and totals
  const { dayCosts, totalCost, hasMeals } = useMemo(() => {
    const costs = [];
    let total = 0;
    let any = false;

    for (let day = 0; day < numDays; day++) {
      const daySlots = mealPlan[day] || {};
      const dayRecipes = categories
        .map((cat) => daySlots[cat])
        .filter(Boolean)
        .map((id) => recipeMap.get(id))
        .filter(Boolean);

      if (dayRecipes.length > 0) {
        any = true;
        const daySubs = appliedSubstitutions[day] || {};
        const cost = calculateDayCost(dayRecipes, ingredientMap, daySubs);
        costs.push({ day, cost, recipeCount: dayRecipes.length });
        total += cost;
      } else {
        costs.push({ day, cost: 0, recipeCount: 0 });
      }
    }

    return { dayCosts: costs, totalCost: total, hasMeals: any };
  }, [mealPlan, numDays, appliedSubstitutions]);

  // Run optimizer for each day that exceeds budget
  useEffect(() => {
    if (!hasMeals) return;

    for (let day = 0; day < numDays; day++) {
      const daySlots = mealPlan[day] || {};
      const dayRecipes = categories
        .map((cat) => daySlots[cat])
        .filter(Boolean)
        .map((id) => recipeMap.get(id))
        .filter(Boolean);

      if (dayRecipes.length === 0) continue;

      const daySubs = appliedSubstitutions[day] || {};
      const dayCost = calculateDayCost(dayRecipes, ingredientMap, daySubs);

      // Calculate remaining total budget excluding other days' costs
      const otherDaysCost = dayCosts
        .filter((d) => d.day !== day)
        .reduce((sum, d) => sum + d.cost, 0);
      const totalBudgetRemaining = totalBudget - otherDaysCost;

      const effectiveBudget = Math.min(dailyBudget, totalBudgetRemaining);

      if (dayCost > effectiveBudget) {
        const result = optimizeBudget(
          dayRecipes,
          ingredientMap,
          dailyBudget,
          totalBudgetRemaining,
          daySubs
        );

        if (result.suggestions.length > 0) {
          dispatch({
            type: ActionTypes.SET_SUBSTITUTIONS,
            payload: { day, suggestions: result.suggestions },
          });
        }
      }
    }
  }, [mealPlan, numDays, dailyBudget, totalBudget, appliedSubstitutions]);

  // Check if any day still exceeds budget after all optimizations
  const budgetExhausted = useMemo(() => {
    for (let day = 0; day < numDays; day++) {
      const info = dayCosts[day];
      if (info.cost > 0 && info.cost > dailyBudget) {
        const daySubs = substitutions[day] || [];
        if (daySubs.length === 0) {
          return { day, cost: info.cost, budget: dailyBudget };
        }
      }
    }
    if (totalCost > totalBudget && totalCost > 0) {
      // Check if there are any remaining suggestions anywhere
      const hasAnySuggestions = Object.values(substitutions).some(
        (s) => s && s.length > 0
      );
      if (!hasAnySuggestions) {
        return { cost: totalCost, budget: totalBudget, isTotal: true };
      }
    }
    return null;
  }, [dayCosts, totalCost, dailyBudget, totalBudget, substitutions, numDays]);

  // Collect all pending substitutions across days
  const allPendingSubs = useMemo(() => {
    const result = [];
    for (let day = 0; day < numDays; day++) {
      const daySubs = substitutions[day] || [];
      daySubs.forEach((sub, index) => {
        result.push({ ...sub, day, index });
      });
    }
    return result;
  }, [substitutions, numDays]);

  // Calculate total savings from applied substitutions
  const totalSavings = useMemo(() => {
    // Simple estimate: sum up all pending suggestion savings that were accepted
    // This is approximate
    return allPendingSubs.reduce((sum, sub) => sum + (sub.savings || 0), 0);
  }, [allPendingSubs]);

  const budgetPercentage = totalBudget > 0 ? (totalCost / totalBudget) * 100 : 0;
  const progressClass =
    budgetPercentage > 100 ? 'over-budget' : budgetPercentage > 80 ? 'near-budget' : 'under-budget';

  if (!hasMeals) {
    return (
      <div className="budget-section">
        <div className="section-header">
          <span className="section-icon">💰</span>
          <h2>Budget</h2>
        </div>
        <div className="budget-empty glass-card-static">
          <span className="budget-empty-icon">📊</span>
          <p>Add recipes to see budget analysis and optimization suggestions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="budget-section slide-up">
      <div className="section-header">
        <span className="section-icon">💰</span>
        <h2>Budget</h2>
      </div>

      {budgetExhausted && <BudgetWarning info={budgetExhausted} />}

      <div className="budget-cards">
        {/* Total Budget Card */}
        <div className="budget-card glass-card-static">
          <div className="budget-card-header">
            <span className="budget-card-label">Total Plan Cost</span>
            <span className={`price ${totalCost > totalBudget ? 'price-negative' : 'price-positive'}`}>
              ₹{totalCost.toFixed(0)}
              <span className="budget-of"> / ₹{totalBudget}</span>
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-bar-fill ${progressClass}`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
          {totalCost > totalBudget && (
            <span className="budget-over-amount price price-negative">
              ₹{(totalCost - totalBudget).toFixed(0)} over budget
            </span>
          )}
        </div>

        {/* Per-Day Breakdown */}
        <div className="budget-card glass-card-static">
          <span className="budget-card-label">Daily Breakdown</span>
          <div className="budget-day-list">
            {dayCosts.map(({ day, cost, recipeCount }) => {
              if (recipeCount === 0) return null;
              const isOver = cost > dailyBudget;
              const pct = dailyBudget > 0 ? (cost / dailyBudget) * 100 : 0;
              return (
                <div key={day} className="budget-day-row">
                  <span className="budget-day-label">Day {day + 1}</span>
                  <div className="budget-day-bar-wrapper">
                    <div className="progress-bar budget-day-bar">
                      <div
                        className={`progress-bar-fill ${
                          isOver ? 'over-budget' : pct > 80 ? 'near-budget' : 'under-budget'
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className={`price budget-day-cost ${isOver ? 'price-negative' : 'price-neutral'}`}>
                    ₹{cost.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Substitution Suggestions */}
      {allPendingSubs.length > 0 && (
        <div className="budget-substitutions">
          <div className="section-header">
            <span className="section-icon">🔄</span>
            <h2>Substitution Suggestions</h2>
            <span className="badge badge-amber">{allPendingSubs.length} available</span>
          </div>

          <div className="sub-cards">
            {allPendingSubs.map((sub) => (
              <div key={`${sub.day}-${sub.index}`} className="sub-card glass-card-static">
                <div className="sub-card-header">
                  <span className="badge badge-violet">Day {sub.day + 1}</span>
                  <span className="price price-positive sub-savings">
                    Save ₹{sub.savings.toFixed(0)}
                  </span>
                </div>
                <div className="sub-card-swap">
                  <div className="sub-original">
                    <span className="sub-label">Replace</span>
                    <span className="sub-name">{sub.originalName}</span>
                    <span className="price price-negative">₹{sub.originalUnitPrice}/{sub.unit}</span>
                  </div>
                  <span className="sub-arrow">→</span>
                  <div className="sub-substitute">
                    <span className="sub-label">With</span>
                    <span className="sub-name">{sub.substituteName}</span>
                    <span className="price price-positive">₹{sub.substituteUnitPrice}/{sub.unit}</span>
                  </div>
                </div>
                <div className="sub-card-actions">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() =>
                      dispatch({
                        type: ActionTypes.ACCEPT_SUBSTITUTION,
                        payload: { day: sub.day, index: sub.index },
                      })
                    }
                  >
                    ✓ Accept
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() =>
                      dispatch({
                        type: ActionTypes.REJECT_SUBSTITUTION,
                        payload: { day: sub.day, index: sub.index },
                      })
                    }
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
