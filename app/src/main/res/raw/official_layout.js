// Header and action rows styled like the official Facebook app.
// Facebook's bottom nav is already at the bottom in their current design;
// this script no longer needs to reposition it.
(function() {
    if (window._nbOfficialLayout) return;
    window._nbOfficialLayout = true;

    const LIKE = '[role="button"][aria-label*="more reactions"]';
    // Not inside .fixed-container: the photo viewer's own dark action bar keeps Facebook's layout.
    const ACTION_ROW = `div:has(> ${LIKE}):not(.fixed-container *)`;
    const ACTION_BTN = `${ACTION_ROW} > :is(${LIKE}, [role="button"][aria-label$="comment"], ` +
        '[role="button"][aria-label$="comments"], [role="button"][aria-label$="share"])';
    const css = `
        /* Plain header icons, no grey circles (drawn by ::before). */
        [role="button"][aria-label="Search Facebook"] > div::before,
        [role="button"][aria-label*="essenger"] > div::before,
        #custom-settings-btn > div::before {
            background: transparent !important;
        }
        /* Settings + button (scripts.js) at the size of the other header icons. */
        #custom-settings-btn svg { width: 24px !important; height: 24px !important; }
        /* Facebook's own pull-to-refresh spinner; pull_to_refresh.js draws Nobook's indicator. */
        .pull-to-refresh-spinner-container { visibility: hidden !important; }
        /* Spacer injected by JS (nb-bottom-spacer) pads the feed; nothing else needs padding-bottom. */
        #nb-bottom-spacer { height: 56px; display: block; flex-shrink: 0; pointer-events: none; }
        /* Like / comment / share row as in the official app: plain icons with the count beside
           them, no grey pills. m.facebook stacks the buttons with negative margins, so they are
           laid out as a flex row instead (the label has no "comments" suffix without a count). */
        ${ACTION_ROW} {
            display: flex !important; flex-direction: row !important; align-items: center !important;
            height: 46px !important; padding: 0 0 0 10px !important; box-sizing: border-box !important;
        }
        ${ACTION_BTN} {
            margin: 0 16px 0 0 !important; width: auto !important; height: 46px !important;
            display: flex !important; flex-direction: row !important; align-items: center !important;
        }
        ${ACTION_BTN} > div {
            width: auto !important; height: auto !important; margin: 0 !important; padding: 0 !important;
            display: flex !important; flex-direction: row !important; align-items: center !important;
        }
        ${ACTION_BTN} > div::before, ${ACTION_BTN} > div::after { background: transparent !important; }
        ${ACTION_BTN} > div > div { margin: 0 !important; width: auto !important; height: auto !important; }
        ${ACTION_BTN} > div > div + div { margin: 0 0 0 3px !important; padding-right: 4px !important; }
        ${ACTION_BTN} > div > div + div:not(:has(span)) { display: none !important; }
        ${ACTION_BTN} > div > div + div span { font-size: 14px !important; font-weight: 500 !important; }
        ${ACTION_ROW} > [role="presentation"] { flex: 1 1 0 !important; margin: 0 !important; min-width: 0 !important; }
        ${ACTION_ROW} > [role="button"][aria-label$="reacted"] { margin: 0 0 0 auto !important; }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    let _fixedNav = null;

    const positionNavBar = () => {
        // If the nav bar we fixed was removed from the DOM (SPA navigation), forget it
        // so we can set up the new one on the next tick.
        if (_fixedNav && !document.contains(_fixedNav)) {
            _fixedNav = null;
        }

        const navs = document.querySelectorAll(
            '[role="tablist"][data-mcomponent="MContainer"][data-actual-height="50"]'
        );
        navs.forEach((nav) => {
            if (nav === _fixedNav) {
                // Our fixed bar — counteract Facebook's scroll-hide animation.
                nav.style.setProperty('transform', 'none', 'important');
                nav.style.setProperty('visibility', 'visible', 'important');
                nav.style.setProperty('opacity', '1', 'important');
                return;
            }

            if (_fixedNav) {
                // A second bar appeared while ours is still alive → React duplicate.
                // Collapse it so it takes no layout space.
                nav.style.setProperty('height', '0', 'important');
                nav.style.setProperty('min-height', '0', 'important');
                nav.style.setProperty('overflow', 'hidden', 'important');
                nav.style.setProperty('padding', '0', 'important');
                nav.style.setProperty('margin', '0', 'important');
                nav.style.setProperty('visibility', 'hidden', 'important');
                return;
            }

            // First (or post-navigation) nav bar — set it up.
            const rect = nav.getBoundingClientRect();
            if (rect.height === 0) return; // not laid out yet, retry next tick

            nav.style.setProperty('position', 'fixed', 'important');
            nav.style.setProperty('bottom', '0', 'important');
            nav.style.setProperty('top', 'auto', 'important');
            nav.style.setProperty('left', '0', 'important');
            nav.style.setProperty('width', '100vw', 'important');
            nav.style.setProperty('z-index', '9998', 'important');
            nav.style.setProperty('transform', 'none', 'important');
            nav.style.setProperty('visibility', 'visible', 'important');
            nav.style.setProperty('opacity', '1', 'important');
            nav.style.setProperty('margin', '0', 'important');

            _fixedNav = nav;
        });
    };

    const updateSettingsBtn = () => {
        const btn = document.getElementById('custom-settings-btn');
        if (!btn) return;
        // scripts.js's updateButtonColor sets svg[fill] to a dark/light color, turning the
        // entire shape solid. Re-apply our SVG whenever the fill attribute gets corrupted.
        const svg = btn.querySelector('svg');
        if (btn.dataset.nbPlus && svg && svg.getAttribute('fill') === 'none') return;
        btn.dataset.nbPlus = '1';
        const fill = (document.querySelector('meta[name="theme-color"]')?.content?.toLowerCase() === '#ffffff') ? '#242526' : '#d0d0d0';
        btn.innerHTML = `<svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="${fill}" stroke-width="1.8"/><path d="M12 7.5v9M7.5 12h9" stroke="${fill}" stroke-width="1.8" stroke-linecap="round"/></svg>`;
        btn.onclick = () => window.SettingsBridge?.onSettingsToggle?.();
    };

    const ensureSpacer = () => {
        const scroller = document.querySelector('div[data-type="vscroller"]');
        if (!scroller) return;
        let spacer = document.getElementById('nb-bottom-spacer');
        if (!spacer) {
            spacer = document.createElement('div');
            spacer.id = 'nb-bottom-spacer';
        }
        if (scroller.lastChild !== spacer) scroller.appendChild(spacer);
    };

    let timer = null;
    const schedule = () => {
        if (timer) return;
        timer = setTimeout(() => { timer = null; updateSettingsBtn(); }, 200);
    };

    positionNavBar();
    updateSettingsBtn();
    ensureSpacer();
    setInterval(positionNavBar, 250);
    setInterval(updateSettingsBtn, 1000);
    setInterval(ensureSpacer, 1000);
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
})();
