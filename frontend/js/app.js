/**
 * App State Manager
 * Manages global state for the dashboard page.
 */

/** Global app state */
const state = {
  scanId: null,
  scan: null,
  suggestions: [],
  activeCategory: 'all',
  approvedIds: new Set(),
  fileStats: null,
};

const listeners = new Set();

export function getState() {
  return state;
}

export function setState(updates) {
  Object.assign(state, updates);
  listeners.forEach(fn => fn(state));
}

export function onStateChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Get the count of suggestions per category.
 */
export function getCategoryCounts() {
  const counts = { delete: 0, archive: 0, rename: 0, structure: 0 };
  state.suggestions.forEach(s => {
    if (counts.hasOwnProperty(s.category)) {
      counts[s.category]++;
    }
  });
  return counts;
}

/**
 * Get filtered suggestions based on active category.
 */
export function getFilteredSuggestions() {
  if (state.activeCategory === 'all') return state.suggestions;
  return state.suggestions.filter(s => s.category === state.activeCategory);
}

/**
 * Get count of approved (pending execution) suggestions.
 */
export function getApprovedCount() {
  return state.suggestions.filter(s => s.user_decision === 'approved').length;
}

/**
 * Mark a suggestion as approved in local state.
 */
export function markApproved(id) {
  const suggestion = state.suggestions.find(s => s.id === id);
  if (suggestion) {
    suggestion.user_decision = 'approved';
    suggestion.decided_at = new Date().toISOString();
    state.approvedIds.add(id);
    listeners.forEach(fn => fn(state));
  }
}

/**
 * Mark a suggestion as rejected in local state.
 */
export function markRejected(id) {
  const suggestion = state.suggestions.find(s => s.id === id);
  if (suggestion) {
    suggestion.user_decision = 'rejected';
    suggestion.decided_at = new Date().toISOString();
    state.approvedIds.delete(id);
    listeners.forEach(fn => fn(state));
  }
}

/**
 * Get breakdown of approved suggestions by category.
 */
export function getApprovedBreakdown() {
  const breakdown = { delete: 0, archive: 0, rename: 0, structure: 0 };
  state.suggestions
    .filter(s => s.user_decision === 'approved')
    .forEach(s => { breakdown[s.category]++; });
  return breakdown;
}

/**
 * Get IDs of all approved suggestions.
 */
export function getApprovedSuggestionIds() {
  return state.suggestions
    .filter(s => s.user_decision === 'approved')
    .map(s => s.id);
}
