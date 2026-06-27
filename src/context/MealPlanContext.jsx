import { createContext, useContext, useReducer, useMemo } from 'react';
import recipesData from '../data/recipes.json';
import ingredientsData from '../data/ingredients.json';
import { buildIngredientMap } from '../engine/budgetOptimizer';

// --- Build static lookup maps ---
const ingredientMap = buildIngredientMap(ingredientsData);
const recipeMap = new Map(recipesData.map((r) => [r.id, r]));

// --- Initial State ---
function buildInitialMealPlan(numDays) {
  const plan = {};
  for (let i = 0; i < numDays; i++) {
    plan[i] = { Breakfast: null, Lunch: null, Dinner: null };
  }
  return plan;
}

const initialState = {
  numDays: 7,
  dailyBudget: 300,
  totalBudget: 2100,
  selectedRecipeId: null,
  mealPlan: buildInitialMealPlan(7),
  substitutions: {},       // { dayIndex: [{ originalId, substituteId, ... }] }
  appliedSubstitutions: {}, // { dayIndex: { originalIngredientId: substituteIngredientId } }
};

// --- Action Types ---
export const ActionTypes = {
  SET_NUM_DAYS: 'SET_NUM_DAYS',
  SET_DAILY_BUDGET: 'SET_DAILY_BUDGET',
  SET_TOTAL_BUDGET: 'SET_TOTAL_BUDGET',
  ASSIGN_RECIPE: 'ASSIGN_RECIPE',
  REMOVE_RECIPE: 'REMOVE_RECIPE',
  SELECT_RECIPE: 'SELECT_RECIPE',
  SET_SUBSTITUTIONS: 'SET_SUBSTITUTIONS',
  ACCEPT_SUBSTITUTION: 'ACCEPT_SUBSTITUTION',
  REJECT_SUBSTITUTION: 'REJECT_SUBSTITUTION',
  CLEAR_SUBSTITUTIONS: 'CLEAR_SUBSTITUTIONS',
};

// --- Reducer ---
function mealPlanReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_NUM_DAYS: {
      const numDays = Math.min(14, Math.max(1, action.payload.numDays));
      const newPlan = {};
      for (let i = 0; i < numDays; i++) {
        newPlan[i] = state.mealPlan[i] || { Breakfast: null, Lunch: null, Dinner: null };
      }
      return { ...state, numDays, mealPlan: newPlan };
    }

    case ActionTypes.SET_DAILY_BUDGET:
      return { ...state, dailyBudget: Math.max(0, action.payload.amount) };

    case ActionTypes.SET_TOTAL_BUDGET:
      return { ...state, totalBudget: Math.max(0, action.payload.amount) };

    case ActionTypes.ASSIGN_RECIPE: {
      const { day, category, recipeId } = action.payload;
      return {
        ...state,
        mealPlan: {
          ...state.mealPlan,
          [day]: {
            ...state.mealPlan[day],
            [category]: recipeId,
          },
        },
      };
    }

    case ActionTypes.REMOVE_RECIPE: {
      const { day, category } = action.payload;
      return {
        ...state,
        mealPlan: {
          ...state.mealPlan,
          [day]: {
            ...state.mealPlan[day],
            [category]: null,
          },
        },
      };
    }

    case ActionTypes.SELECT_RECIPE:
      return { ...state, selectedRecipeId: action.payload.recipeId };

    case ActionTypes.SET_SUBSTITUTIONS: {
      const { day, suggestions } = action.payload;
      return {
        ...state,
        substitutions: {
          ...state.substitutions,
          [day]: suggestions,
        },
      };
    }

    case ActionTypes.ACCEPT_SUBSTITUTION: {
      const { day, index } = action.payload;
      const daySubs = state.substitutions[day] || [];
      const sub = daySubs[index];
      if (!sub) return state;

      const newPending = daySubs.filter((_, i) => i !== index);
      const newApplied = {
        ...state.appliedSubstitutions,
        [day]: {
          ...(state.appliedSubstitutions[day] || {}),
          [sub.originalId]: sub.substituteId,
        },
      };

      return {
        ...state,
        substitutions: { ...state.substitutions, [day]: newPending },
        appliedSubstitutions: newApplied,
      };
    }

    case ActionTypes.REJECT_SUBSTITUTION: {
      const { day, index } = action.payload;
      const daySubs = state.substitutions[day] || [];
      return {
        ...state,
        substitutions: {
          ...state.substitutions,
          [day]: daySubs.filter((_, i) => i !== index),
        },
      };
    }

    case ActionTypes.CLEAR_SUBSTITUTIONS: {
      const { day } = action.payload;
      return {
        ...state,
        substitutions: { ...state.substitutions, [day]: [] },
      };
    }

    default:
      return state;
  }
}

// --- Context ---
const MealPlanContext = createContext(null);

export function MealPlanProvider({ children }) {
  const [state, dispatch] = useReducer(mealPlanReducer, initialState);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      recipes: recipesData,
      ingredientMap,
      recipeMap,
    }),
    [state]
  );

  return (
    <MealPlanContext.Provider value={value}>
      {children}
    </MealPlanContext.Provider>
  );
}

export function useMealPlan() {
  const context = useContext(MealPlanContext);
  if (!context) {
    throw new Error('useMealPlan must be used within a MealPlanProvider');
  }
  return context;
}

export default MealPlanContext;
