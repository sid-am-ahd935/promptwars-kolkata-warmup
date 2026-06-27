import { useState } from 'react';
import './BudgetWarning.css';

export default function BudgetWarning({ info }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const message = info.isTotal
    ? `Total budget cannot be met even with all available substitutions. Best-effort total: ₹${info.cost.toFixed(0)} (₹${(info.cost - info.budget).toFixed(0)} over budget).`
    : `Day ${info.day + 1} budget cannot be met even with all available substitutions. Current cost: ₹${info.cost.toFixed(0)} vs budget ₹${info.budget} (₹${(info.cost - info.budget).toFixed(0)} over).`;

  return (
    <div className="budget-warning slide-down">
      <div className="budget-warning-content">
        <span className="budget-warning-icon">⚠️</span>
        <p className="budget-warning-message">{message}</p>
      </div>
      <button
        className="btn btn-ghost btn-sm budget-warning-dismiss"
        onClick={() => setDismissed(true)}
      >
        Dismiss
      </button>
    </div>
  );
}
