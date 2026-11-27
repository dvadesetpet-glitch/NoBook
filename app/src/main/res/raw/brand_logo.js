// Replaces the Facebook wordmark in the header with the text "noBook".
// The original image keeps its space (hidden), so the header layout does not move.
(function() {
    if (window._nbBrandLogo) return;
    window._nbBrandLogo = true;

    const TEXT = 'noBook';
    const MARK = 'nb-brand-text';

    const isLogoButton = (el) => {
        const label = (el.getAttribute('aria-label') || '').toLowerCase();
        if (!label.includes('facebook') || !el.querySelector('img')) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.width <= 170 && r.height > 0 && r.height <= 40 && r.top < 90;
    };

    const apply = (container) => {
        const img = container.querySelector('img');
        if (img && img.style.visibility !== 'hidden') img.style.visibility = 'hidden';

        let text = container.querySelector('.' + MARK);
        if (!text) {
            if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
            text = document.createElement('span');
            text.className = MARK;
            text.textContent = TEXT;
            text.setAttribute('style', [
                'position:absolute', 'left:4px', 'top:0', 'height:100%', 'display:flex', 'align-items:center',
                'font:800 italic 28px/1 "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                'letter-spacing:-0.5px', 'white-space:nowrap', 'pointer-events:none'
            ].join(';'));
            container.appendChild(text);
        }
        text.style.color = '#0866ff'; // Facebook blue in both themes

        // Tapping the logo opens Nobook settings (instead of Facebook's "go home"). Capture phase,
        // so Facebook's own handler never sees the tap. Without the bridge the tap is left alone.
        if (!container.dataset.nbSettings) {
            container.dataset.nbSettings = '1';
            // Facebook marks the whole logo chain pointer-events:none (it is not a link here).
            container.style.setProperty('pointer-events', 'auto', 'important');
            container.addEventListener('click', (e) => {
                if (!window.SettingsBridge?.onSettingsToggle) return;
                e.preventDefault();
                e.stopImmediatePropagation();
                window.SettingsBridge.onSettingsToggle();
            }, true);
        }
    };

    const scan = () => {
        document.querySelectorAll('[role="button"][aria-label]').forEach((el) => {
            if (el.querySelector('.' + MARK) || isLogoButton(el)) apply(el);
        });
    };

    let timer = null;
    const schedule = () => {
        if (timer) return;
        timer = setTimeout(() => {
            timer = null;
            scan();
        }, 300);
    };

    scan();
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
})();
