/**
 * Suggestion List Component
 * Filterable, sortable list of suggestion cards.
 */

import { createSuggestionCard } from './suggestion-card.js';

/**
 * Render the suggestion list with toolbar.
 * @param {HTMLElement} container
 * @param {Array} suggestions
 * @param {{ onApprove: (id: string) => void, onReject: (id: string) => void, onApproveAll: () => void }} callbacks
 */
export function renderSuggestionList(container, suggestions, callbacks) {
  if (suggestions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">\u2705</div>
        <div class="empty-state__title">All Clear</div>
        <div class="empty-state__text">No suggestions in this category.</div>
      </div>
    `;
    return;
  }

  // Toolbar
  const toolbarHtml = `
    <div class="toolbar">
      <input
        type="text"
        class="toolbar__search"
        placeholder="Filter by filename..."
        id="suggestionSearch"
        aria-label="Filter suggestions"
      >
      <div class="toolbar__actions">
        <select class="toolbar__sort" id="suggestionSort" aria-label="Sort suggestions">
          <option value="severity">Sort: Severity</option>
          <option value="confidence">Sort: Confidence</option>
          <option value="name">Sort: Name</option>
        </select>
        <button class="btn btn--sm" style="background:var(--accent-approve);color:var(--bg-primary);border-color:var(--accent-approve);" id="approveAllBtn">
          \u2713 APPROVE ALL PENDING
        </button>
      </div>
    </div>
  `;

  container.innerHTML = toolbarHtml + '<div id="suggestionCards"></div>';

  const cardsContainer = container.querySelector('#suggestionCards');
  const searchInput = container.querySelector('#suggestionSearch');
  const sortSelect = container.querySelector('#suggestionSort');
  const approveAllBtn = container.querySelector('#approveAllBtn');

  let currentFilter = '';
  let currentSort = 'severity';

  function renderCards() {
    let filtered = suggestions;

    // Apply search filter
    if (currentFilter) {
      const query = currentFilter.toLowerCase();
      filtered = filtered.filter(s =>
        (s.current_value || '').toLowerCase().includes(query) ||
        (s.title || '').toLowerCase().includes(query) ||
        (s.description || '').toLowerCase().includes(query)
      );
    }

    // Apply sort
    filtered = [...filtered].sort((a, b) => {
      if (currentSort === 'confidence') return b.confidence - a.confidence;
      if (currentSort === 'name') return (a.current_value || '').localeCompare(b.current_value || '');
      // severity: critical > high > medium > low
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4);
    });

    cardsContainer.innerHTML = '';

    filtered.forEach((suggestion, i) => {
      const card = createSuggestionCard(suggestion, {
        onApprove: callbacks.onApprove,
        onReject: callbacks.onReject,
      });
      // Stagger animation
      const staggerClass = `stagger-${Math.min(i + 1, 10)}`;
      card.classList.add('animate-slide-in', staggerClass);
      cardsContainer.appendChild(card);
    });

    if (filtered.length === 0) {
      cardsContainer.innerHTML = `
        <div class="empty-state" style="padding:var(--space-8);">
          <div class="empty-state__text">No matches found.</div>
        </div>
      `;
    }
  }

  searchInput.addEventListener('input', (e) => {
    currentFilter = e.target.value;
    renderCards();
  });

  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderCards();
  });

  approveAllBtn.addEventListener('click', () => {
    callbacks.onApproveAll?.();
  });

  renderCards();
}
