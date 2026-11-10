(function() {

    if (window.isDesktopMode()) {
        (() => {
          const waitForBanner = () => new Promise(resolve => {
            const existing = document.querySelector('div[role="banner"]');
            if (existing) return resolve(existing);

            new MutationObserver((mutations, obs) => {
              for (const { addedNodes } of mutations) {
                for (const node of addedNodes) {
                  if (node.nodeType === 1 && node.matches('div[role="banner"]')) {
                    obs.disconnect();
                    return resolve(node);
                  }
                }
              }
            }).observe(document.body, { childList: true, subtree: true });
          });

          const forceFixed = el => {
            if (el?.classList.contains('xixxii4')) {
              el.style.setProperty('position', 'fixed', 'important');
            }
          };

          waitForBanner().then(banner => {
            const style = document.createElement('style');
            style.textContent = `
              div[role="banner"].xixxii4,
              div[role="banner"] .xixxii4 {
                position: fixed !important;
              }
            `;
            document.head.appendChild(style);

            forceFixed(banner);
            banner.querySelectorAll('.xixxii4').forEach(forceFixed);

            new MutationObserver(mutations => {
              for (const m of mutations) {
                if (m.type === 'childList') {
                  m.addedNodes.forEach(n => {
                    forceFixed(n);
                    n.querySelectorAll?.('.xixxii4')?.forEach(forceFixed);
                  });
                } else if (m.type === 'attributes' && m.attributeName === 'class') {
                  forceFixed(m.target);
                }
              }
            }).observe(banner, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
          });
        })();
        return;
    }

    const applyStyles = () => {
        const navbar = document.querySelector('div[data-tti-phase="-1"][data-mcomponent="MContainer"][data-type="container"][data-focusable="true"].m');
        const tabbar = document.querySelector('div[role="tablist"][data-tti-phase="-1"][data-type="container"][data-mcomponent="MContainer"].m') ||
            document.querySelector('[role="tablist"]') ||
            (() => {
                const t = document.querySelector('[role="tab"][aria-label^="feed"], [role="tab"][aria-label*="home" i]');
                return t && (t.closest('[role="tablist"]') || t.closest('[data-type="container"][data-mcomponent="MContainer"]') || t.parentElement?.parentElement);
            })();
        const scroller = document.querySelector('div[data-type="vscroller"][data-is-pull-to-refresh-allowed="true"]');

        const hasLogo = navbar?.querySelector('div[aria-label*="Facebook"]');
        // Only a bare tab bar goes to the bottom. On some pages (Friends) Facebook puts the page
        // title in the same block, which would then end up under the tabs.
        const hasFeed = tabbar?.querySelector('div[aria-label*="feed"]') &&
            tabbar.getBoundingClientRect().height <= 60;

        const navbarHeight = navbar ? parseFloat(getComputedStyle(navbar).height) || parseFloat(navbar.style.height) || 0 : 0;
        const tabbarHeight = tabbar ? parseFloat(getComputedStyle(tabbar).height) || parseFloat(tabbar.style.height) || 0 : 0;

        if (hasLogo) Object.assign(navbar.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            zIndex: '1000',
            pointerEvents: 'auto'
        });

        const TABBAR_PROPS = ['position', 'bottom', 'top', 'left', 'width', 'z-index', 'pointer-events'];
        if (tabbar && !hasFeed && tabbar.dataset.nbFixed) {
            // The same block can grow a page title after a page change: let it go again.
            TABBAR_PROPS.forEach((prop) => tabbar.style.removeProperty(prop));
            delete tabbar.dataset.nbFixed;
        }
        if (hasFeed) {
            tabbar.dataset.nbFixed = '1';
            tabbar.style.setProperty('position', 'fixed', 'important');
            tabbar.style.setProperty('bottom', '0', 'important');
            tabbar.style.setProperty('top', 'auto', 'important');
            tabbar.style.setProperty('left', '0', 'important');
            tabbar.style.setProperty('width', '100%', 'important');
            tabbar.style.setProperty('z-index', '999', 'important');
            tabbar.style.setProperty('pointer-events', 'auto', 'important');
        }

        if (scroller) {
            const topOffset = hasLogo ? navbarHeight : 0;
            const bottomOffset = hasFeed ? tabbarHeight : 0;
            // The navbar and tab bar sit inside the scroller too. They are fixed now, so the
            // offset goes on the first element that is still part of the page, and an offset
            // that an earlier pass put on the bars themselves is taken off again.
            [navbar, tabbar].forEach((bar) => {
                if (bar && scroller.contains(bar)) {
                    bar.style.marginTop = '';
                    bar.style.paddingBottom = '';
                }
            });
            const scrollContent = Array.from(scroller.children).find((el) =>
                el.tagName === 'DIV' && !el.classList.contains('pull-to-refresh-spinner-container') &&
                el !== navbar && el !== tabbar && !el.contains(navbar) && !el.contains(tabbar));
            if (scrollContent) {
                scrollContent.style.marginTop = topOffset + 'px';
                scrollContent.style.paddingBottom = '';
            } else {
                scroller.style.paddingTop = topOffset + 'px';
            }
            // Room for the tab bar after the last post, not before the first one.
            scroller.style.paddingBottom = bottomOffset + 'px';

            const spinnerContainer = scroller.querySelector('.pull-to-refresh-spinner-container');
            if (spinnerContainer) Object.assign(spinnerContainer.style, {
                zIndex: '1001',
            });

            const spinner = scroller.querySelector('.pull-to-refresh-spinner');
            if (spinner) spinner.style.margin = '0 auto';
        }

        Object.assign(document.body.style, {
            paddingTop: '0',
            marginTop: '0',
            overflow: 'visible',
            height: '100%'
        });
    };

    applyStyles();
    new MutationObserver(applyStyles).observe(document.body, { childList: true, subtree: true });
})();