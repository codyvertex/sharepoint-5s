/**
 * Category Tabs Component
 * Tab navigation for Delete / Archive / Rename / Structure categories.
 */

const CATEGORIES = [
  { id: 'all', label: 'ALL', icon: '' },
  { id: 'delete', label: 'DELETE', icon: '' },
  { id: 'archive', label: 'ARCHIVE', icon: '' },
  { id: 'rename', label: 'RENAME', icon: '' },
  { id: 'structure', label: 'STRUCTURE', icon: '' },
];

/**
 * Render category tabs.
 * @param {HTMLElement} container
 * @param {{ delete: number, archive: number, rename: number, structure: number }} counts
 * @param {string} activeCategory
 * @param {(category: string) => void} onChange
 */
export function renderCategoryTabs(container, counts, activeCategory, onChange) {
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  container.innerHTML = `
    <div class="tabs" role="tablist">
      ${CATEGORIES.map(cat => {
        const count = cat.id === 'all' ? totalCount : (counts[cat.id] || 0);
        const isActive = activeCategory === cat.id;
        return `
          <button
            class="tab ${isActive ? 'tab--active' : ''}"
            data-category="${cat.id}"
            role="tab"
            aria-selected="${isActive}"
            aria-controls="suggestion-list"
          >
            ${cat.label}
            <span class="tab__count">${count}</span>
          </button>
        `;
      }).join('')}
    </div>
  `;

  // Attach click handlers
  container.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const category = tab.dataset.category;
      onChange(category);
    });
  });
}
