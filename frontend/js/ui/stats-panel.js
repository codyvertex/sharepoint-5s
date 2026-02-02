/**
 * Stats Panel Component
 * Shows summary statistics and category counters after analysis.
 */

/**
 * Render the stats panel.
 * @param {HTMLElement} container
 * @param {object} fileStats - From getFileStats()
 * @param {{ delete: number, archive: number, rename: number, structure: number }} categoryCounts
 */
export function renderStatsPanel(container, fileStats, categoryCounts) {
  container.innerHTML = `
    <div class="dashboard__stats">
      <div class="stat-card animate-fade-in-up stagger-1">
        <div class="stat-card__value">${fileStats.totalFiles.toLocaleString()}</div>
        <div class="stat-card__label">Total Files</div>
      </div>
      <div class="stat-card animate-fade-in-up stagger-2">
        <div class="stat-card__value">${formatBytes(fileStats.totalSize)}</div>
        <div class="stat-card__label">Total Size</div>
      </div>
      <div class="stat-card animate-fade-in-up stagger-3">
        <div class="stat-card__value">${fileStats.avgAge}</div>
        <div class="stat-card__label">Avg Age (days)</div>
      </div>
      <div class="stat-card animate-fade-in-up stagger-4">
        <div class="stat-card__value">${fileStats.maxDepth}</div>
        <div class="stat-card__label">Max Depth</div>
      </div>
      <div class="stat-card stat-card--delete animate-fade-in-up stagger-5">
        <div class="stat-card__value">${categoryCounts.delete}</div>
        <div class="stat-card__label">Delete</div>
      </div>
      <div class="stat-card stat-card--archive animate-fade-in-up stagger-6">
        <div class="stat-card__value">${categoryCounts.archive}</div>
        <div class="stat-card__label">Archive</div>
      </div>
      <div class="stat-card stat-card--rename animate-fade-in-up stagger-7">
        <div class="stat-card__value">${categoryCounts.rename}</div>
        <div class="stat-card__label">Rename</div>
      </div>
      <div class="stat-card stat-card--structure animate-fade-in-up stagger-8">
        <div class="stat-card__value">${categoryCounts.structure}</div>
        <div class="stat-card__label">Structure</div>
      </div>
    </div>
  `;
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
