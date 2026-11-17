// Header and action rows styled like the official Facebook app.
// Facebook's bottom nav is already at the bottom in their current design;
// this script no longer needs to reposition it.
(function() {
    if (window._nbOfficialLayout) return;
    window._nbOfficialLayout = true;

    // Facebook's aria-labels are localized ("...more reactions" / "...like, dvaput dodirnite..."),
    // so match the part that is the same in every language: the "like, " after the count.
    const LIKE = '[role="button"]:is([aria-label*="more reactions"], [aria-label*="like, "])';
    // Not inside .fixed-container: the photo viewer's own dark action bar keeps Facebook's layout.
    const ACTION_ROW = `div:has(> ${LIKE}):not(.fixed-container *)`;
    const ACTION_BTN = `${ACTION_ROW} > :is(${LIKE}, [role="button"][aria-label$="comment"], ` +
        '[role="button"][aria-label$="comments"], [role="button"][aria-label$="share"], ' +
        'div:not([role]):not(:first-child))';
    const css = `
        /* Plain header icons, no grey circles (drawn by ::before). Labels end in "Facebook"
           in every language (Search Facebook / Pretraži Facebook / ...). */
        [role="button"][aria-label$="Facebook"] > div::before,
        [role="button"][aria-label*="essenger"] > div::before {
            background: transparent !important;
        }
        /* Header icons at the official app's size. */
        [role="button"][aria-label$="Facebook"] > div,
        [role="button"][aria-label$="Facebook"] > div * { font-size: 26px !important; }
        /* "What's on your mind?" as an outlined pill, like the official app. */
        [data-nb-composer] > div[role="button"]::before {
            background: transparent !important; border: 1px solid #5a5d63 !important;
            border-radius: 999px !important; box-sizing: border-box !important;
        }
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
        /* The "211 reacted / 46 comments" summary line: as in the official app only the reaction
           icons stay, pushed to the right; the counts sit next to the action icons instead. */
        ${ACTION_ROW} > [role="button"]:not(:is(${LIKE}, [aria-label$="comment"], [aria-label$="comments"], [aria-label$="share"], [aria-label$="reacted"])) {
            order: 99 !important; margin: 0 10px 0 auto !important; width: auto !important;
            height: 46px !important; flex: 0 0 auto !important;
            display: flex !important; flex-direction: row !important; align-items: center !important;
        }
        ${ACTION_ROW} > [role="button"]:not(:is(${LIKE}, [aria-label$="comment"], [aria-label$="comments"], [aria-label$="share"], [aria-label$="reacted"])) > :first-child {
            margin: 0 !important; height: auto !important; padding-right: 8px !important;
        }
        /* Reaction icons: the heart has a notch cut for the previous icon, so overlap them slightly. */
        ${ACTION_ROW} > [role="button"]:not(:is(${LIKE}, [aria-label$="comment"], [aria-label$="comments"], [aria-label$="share"], [aria-label$="reacted"])) > :first-child > :nth-child(2) { margin-left: 15px !important; }
        ${ACTION_ROW} > [role="button"]:not(:is(${LIKE}, [aria-label$="comment"], [aria-label$="comments"], [aria-label$="share"], [aria-label$="reacted"])) > :first-child > :nth-child(3) { margin-left: 30px !important; }
        ${ACTION_ROW} > [role="button"]:not(:is(${LIKE}, [aria-label$="comment"], [aria-label$="comments"], [aria-label$="share"], [aria-label$="reacted"])) > :first-child > :nth-child(4) { margin-left: 45px !important; }
        ${ACTION_ROW} > [role="button"]:not(:is(${LIKE}, [aria-label$="comment"], [aria-label$="comments"], [aria-label$="share"], [aria-label$="reacted"])) > :not(:first-child) { display: none !important; }
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

    // The status composer: wide button near the top of the feed whose first child is the
    // pill (a role=button). Its aria-label is localized, so find it by shape.
    const markComposer = () => {
        document.querySelectorAll('[role="button"][data-type="container"]:not([data-nb-composer])').forEach((el) => {
            const pill = el.firstElementChild;
            if (!pill || pill.getAttribute('role') !== 'button') return;
            const r = el.getBoundingClientRect();
            if (r.width > 180 && r.width < 320 && r.height > 28 && r.height < 48 && r.top < 160 && r.top > 0) {
                el.setAttribute('data-nb-composer', '1');
            }
        });
    };

    positionNavBar();
    ensureSpacer();
    setInterval(positionNavBar, 250);
    setInterval(ensureSpacer, 1000);
    markComposer();
    setInterval(markComposer, 1000);
})();
