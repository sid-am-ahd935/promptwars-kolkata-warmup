import { useMemo, useState } from 'react';
import { useMealPlan } from '../context/MealPlanContext';
import { aggregateFullGroceryList, calculateTotalCost } from '../engine/budgetOptimizer';
import './GroceryList.css';

export default function GroceryList() {
  const { state, recipes, ingredientMap } = useMealPlan();
  const { mealPlan, numDays, appliedSubstitutions } = state;
  const [sortBy, setSortBy] = useState('cost'); // 'cost' | 'name' | 'quantity'

  const groceryList = useMemo(() => {
    return aggregateFullGroceryList(
      mealPlan,
      recipes,
      ingredientMap,
      appliedSubstitutions,
      numDays
    );
  }, [mealPlan, recipes, ingredientMap, appliedSubstitutions, numDays]);

  const sortedList = useMemo(() => {
    const list = [...groceryList];
    switch (sortBy) {
      case 'cost':
        return list.sort((a, b) => b.totalCost - a.totalCost);
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'quantity':
        return list.sort((a, b) => b.totalQuantity - a.totalQuantity);
      default:
        return list;
    }
  }, [groceryList, sortBy]);

  const totalCost = useMemo(() => calculateTotalCost(groceryList), [groceryList]);

  if (groceryList.length === 0) {
    return (
      <div className="grocery-section">
        <div className="section-header">
          <span className="section-icon">🛒</span>
          <h2>Grocery List</h2>
        </div>
        <div className="grocery-empty glass-card-static">
          <span className="grocery-empty-icon">🛒</span>
          <p>Add recipes to your meal plan to generate a grocery list</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grocery-section slide-up">
      <div className="section-header">
        <span className="section-icon">🛒</span>
        <h2>Grocery List</h2>
        <span className="badge badge-violet">{groceryList.length} items</span>
        <div className="grocery-sort">
          <label className="control-label">Sort by</label>
          <select
            className="input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="cost">Cost (High → Low)</option>
            <option value="name">Name (A → Z)</option>
            <option value="quantity">Quantity</option>
          </select>
        </div>
      </div>

      <div className="grocery-table-wrapper glass-card-static">
        <table className="grocery-table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th className="text-right">Qty</th>
              <th>Unit</th>
              <th className="text-right">Unit Price</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {sortedList.map((item) => (
              <tr
                key={item.ingredientId}
                className={item.originalId ? 'grocery-row-substituted' : ''}
              >
                <td>
                  <div className="grocery-name-cell">
                    <span>{item.name}</span>
                    {item.originalId && (
                      <span className="badge badge-green grocery-sub-badge">
                        substituted
                      </span>
                    )}
                  </div>
                </td>
                <td className="text-right price price-neutral">
                  {item.totalQuantity.toFixed(2)}
                </td>
                <td className="grocery-unit">{item.unit}</td>
                <td className="text-right price price-neutral">
                  ₹{item.unitPrice}
                </td>
                <td className="text-right price price-neutral">
                  ₹{item.totalCost.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="grocery-total-row">
              <td colSpan="4">
                <strong>Total</strong>
              </td>
              <td className="text-right price price-neutral">
                <strong>₹{totalCost.toFixed(2)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
