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

    // Central hub: one NativeMO shared by all feature scripts that only need childList+subtree.
    // onScan(fn) — calls fn() once now then after each batch; for "re-scan everything" scripts.
    // onAdd(fn)  — calls fn(addedNodes[]) after each batch that added nodes.
    const _nbScan = [], _nbAdd = [];
    let _nbRaf = false, _nbNodes = [];
    new NativeMO((records) => {
        for (let i = 0; i < records.length; i++) {
            const added = records[i].addedNodes;
            for (let j = 0; j < added.length; j++) _nbNodes.push(added[j]);
        }
        if (_nbRaf) return;
        _nbRaf = true;
        requestAnimationFrame(() => {
            _nbRaf = false;
            const nodes = _nbNodes;
            _nbNodes = [];
            for (let i = 0; i < _nbScan.length; i++) _nbScan[i]();
            if (nodes.length) for (let i = 0; i < _nbAdd.length; i++) _nbAdd[i](nodes);
        });
    }).observe(document.body, { childList: true, subtree: true });
    window.__nb = {
        onScan: fn => { _nbScan.push(fn); fn(); },
        onAdd: fn => _nbAdd.push(fn)
    };

    const style = document.createElement('style');
    style.textContent =
        // Action sheet menu items sometimes have a fixed height too short for two-line labels.
        '[role="menuitem"]{height:auto!important;min-height:48px}' +
        // Text-only feed posts use an oversized bold font; normalise to standard reading size.
        'div[data-tracking-duration-id] div[data-mcomponent="TextArea"] .native-text{font-size:15px!important;font-weight:400!important;line-height:1.34!important}';
    (document.head || document.documentElement).appendChild(style);
})();
