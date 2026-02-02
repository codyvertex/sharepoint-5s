/**
 * Action Queue Component
 * Fixed bottom bar showing approved action count with execute button.
 */

/**
 * Render the action bar.
 * @param {HTMLElement} container
 * @param {number} approvedCount
 * @param {{ onExecute: () => void }} callbacks
 */
export function renderActionBar(container, approvedCount, callbacks) {
  container.className = `action-bar ${approvedCount > 0 ? 'action-bar--visible' : ''}`;

  container.innerHTML = `
    <div class="action-bar__count">
      <span>${approvedCount}</span> actions approved
    </div>
    <button class="btn btn--go" id="executeBtn" ${approvedCount === 0 ? 'disabled' : ''}>
      EXECUTE ALL
    </button>
  `;

  const executeBtn = container.querySelector('#executeBtn');
  executeBtn?.addEventListener('click', () => {
    if (approvedCount > 0) {
      callbacks.onExecute?.();
    }
  });
}

/**
 * Show a confirmation modal before executing actions.
 * @param {number} count
 * @param {{ delete: number, rename: number, archive: number, structure: number }} breakdown
 * @returns {Promise<boolean>}
 */
export function showExecuteConfirmation(count, breakdown) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
      <div class="modal">
        <h2 class="modal__title">Confirm Execution</h2>
        <div class="modal__body">
          <p>You are about to execute <strong>${count}</strong> actions on your SharePoint library:</p>
          <ul style="margin-top:var(--space-3);padding-left:var(--space-4);">
            ${breakdown.delete > 0 ? `<li style="color:var(--accent-delete);list-style:disc;">${breakdown.delete} deletions</li>` : ''}
            ${breakdown.rename > 0 ? `<li style="color:var(--accent-rename);list-style:disc;">${breakdown.rename} renames</li>` : ''}
            ${breakdown.archive > 0 ? `<li style="color:var(--accent-archive);list-style:disc;">${breakdown.archive} archive moves</li>` : ''}
            ${breakdown.structure > 0 ? `<li style="color:var(--accent-structure);list-style:disc;">${breakdown.structure} structure changes</li>` : ''}
          </ul>
          <p style="margin-top:var(--space-4);color:var(--accent-archive);font-weight:var(--weight-semibold);">
            This cannot be undone. Deleted files go to the SharePoint recycle bin.
          </p>
        </div>
        <div class="modal__actions">
          <button class="btn btn--ghost" id="cancelBtn">CANCEL</button>
          <button class="btn btn--danger" id="confirmBtn">EXECUTE ${count} ACTIONS</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('modal-overlay--visible'));

    overlay.querySelector('#cancelBtn').addEventListener('click', () => {
      overlay.classList.remove('modal-overlay--visible');
      setTimeout(() => overlay.remove(), 300);
      resolve(false);
    });

    overlay.querySelector('#confirmBtn').addEventListener('click', () => {
      overlay.classList.remove('modal-overlay--visible');
      setTimeout(() => overlay.remove(), 300);
      resolve(true);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('modal-overlay--visible');
        setTimeout(() => overlay.remove(), 300);
        resolve(false);
      }
    });
  });
}
