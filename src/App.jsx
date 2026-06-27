import { MealPlanProvider } from './context/MealPlanContext';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import RecommendationSidebar from './components/RecommendationSidebar';
import BudgetPanel from './components/BudgetPanel';
import GroceryList from './components/GroceryList';
import './App.css';

function AppContent() {
  return (
    <div className="app-layout">
      <Navbar />

      <div className="main-content">
        <div className="dashboard-area">
          <Dashboard />
        </div>
        <div className="sidebar-area">
          <RecommendationSidebar />
        </div>
      </div>

      <div className="sections-area">
        <BudgetPanel />
        <GroceryList />
      </div>

      <footer className="app-footer glass-card-static">
        <p>
          Built with <span className="footer-heart">♥</span> for PromptWars Kolkata
          <span className="footer-divider">•</span>
          Deterministic recommendations powered by Jaccard similarity
          <span className="footer-divider">•</span>
          Zero API calls
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <MealPlanProvider>
      <AppContent />
    </MealPlanProvider>
  );
}
