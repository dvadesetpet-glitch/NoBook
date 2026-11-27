(function() {
    if (window.__nbPerfShim) return;
    window.__nbPerfShim = true;

    // Fix 1.3: batch every MutationObserver callback to one run per animation frame.
    // All feature scripts get debouncing without per-script edits.
    const NativeMO = window.MutationObserver;
    class DebouncedMO extends NativeMO {
        constructor(callback) {
            let pending = [];
            let scheduled = false;
            let self = null;
            super((records, observer) => {
                // Loop instead of push(...records): a huge batch would overflow the argument limit.
                for (let i = 0; i < records.length; i++) pending.push(records[i]);
                if (scheduled) return;
                scheduled = true;
                requestAnimationFrame(() => {
                    scheduled = false;
                    const batch = pending;
                    pending = [];
                    if (batch.length) callback.call(self, batch, observer);
                });
            });
            self = this;
        }
    }
    window.MutationObserver = DebouncedMO;

    // Action sheet menu items sometimes have a fixed height too short for two-line labels.
    const style = document.createElement('style');
    style.textContent = '[role="menuitem"]{height:auto!important;min-height:48px}';
    (document.head || document.documentElement).appendChild(style);
})();
