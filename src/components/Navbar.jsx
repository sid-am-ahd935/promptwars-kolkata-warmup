import { useMealPlan, ActionTypes } from '../context/MealPlanContext';
import './Navbar.css';

export default function Navbar() {
  const { state, dispatch } = useMealPlan();

  const dayOptions = Array.from({ length: 14 }, (_, i) => i + 1);

  return (
    <nav className="navbar glass-card-static">
      <div className="navbar-brand">
        <span className="navbar-logo">🍽️</span>
        <h1 className="navbar-title">MealMind</h1>
        <span className="navbar-subtitle">Smart Meal Planner</span>
      </div>

      <div className="navbar-controls">
        <div className="control-group">
          <label className="control-label">Days</label>
          <select
            className="input input-mono"
            value={state.numDays}
            onChange={(e) =>
              dispatch({
                type: ActionTypes.SET_NUM_DAYS,
                payload: { numDays: parseInt(e.target.value) },
              })
            }
          >
            {dayOptions.map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'Day' : 'Days'}
              </option>
            ))}
          </select>
        </div>

        <div className="control-divider" />

        <div className="control-group">
          <label className="control-label">Daily Budget</label>
          <div className="input-with-prefix">
            <span className="input-prefix">₹</span>
            <input
              type="number"
              className="input input-mono"
              value={state.dailyBudget}
              min={0}
              step={50}
              onChange={(e) =>
                dispatch({
                  type: ActionTypes.SET_DAILY_BUDGET,
                  payload: { amount: parseInt(e.target.value) || 0 },
                })
              }
            />
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">Total Budget</label>
          <div className="input-with-prefix">
            <span className="input-prefix">₹</span>
            <input
              type="number"
              className="input input-mono"
              value={state.totalBudget}
              min={0}
              step={100}
              onChange={(e) =>
                dispatch({
                  type: ActionTypes.SET_TOTAL_BUDGET,
                  payload: { amount: parseInt(e.target.value) || 0 },
                })
              }
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
