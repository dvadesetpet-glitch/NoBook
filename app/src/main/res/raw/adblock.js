(function() {

    if (isDesktopMode()) {
        (function() {
          const selector = 'div.sponsored_ad, article[data-ft*="sponsored_ad"]';

          const removeSponsored = (root = document) => {
            root.querySelectorAll(selector).forEach(el => el.remove());
          };

          removeSponsored();

          const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
              for (const node of mutation.addedNodes) {
                if (!(node instanceof HTMLElement)) continue;
                if (node.matches(selector)) {
                  node.remove();
                } else {
                  removeSponsored(node);
                }
              }
            }
          });
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
        })();

        return;
    }

    const sponsoredTexts = [
        "Sponsored", "Ad", "Gesponsert", "Sponsorlu", "Sponsorowane",
        "Ispoonsara godhameera", "Geborg", "Bersponsor", "Ditaja",
        "Disponsori", "Giisponsoran", "Sponzorováno", "Sponsoreret",
        "Publicidad", "May Sponsor", "Sponsorisée", "Sponsorisé", "Oipytyvôva",
        "Ɗaukar Nayin", "Sponzorirano", "Uterwa inkunga", "Sponsorizzato",
        "Imedhaminiwa", "Hirdetés", "Misy Mpiantoka", "Gesponsord",
        "Sponset", "Patrocinado", "Sponsorizat", "Sponzorované",
        "Sponsoroitu", "Sponsrat", "Được tài trợ", "Χορηγούμενη",
        "Спонсорирано", "Спонзорирано", "Ивээн тэтгэсэн", "Реклама",
        "Спонзорисано", "במימון", "سپانسرڈ", "دارای پشتیبانی مالی",
        "ስፖንሰር የተደረገ", "प्रायोजित", "ተደረገ", "प", "স্পনসর্ড",
        "ਪ੍ਰਯੋਜਿਤ", "પ્રાયોજિત", "ପ୍ରାୟୋଜିତ", "செய்யப்பட்ட செய்யப்பட்ட",
        "చేయబడినది చేయబడినది", "ಪ್ರಾಯೋಜಿಸಲಾಗಿದೆ", "ചെയ്‌തത് ചെയ്‌തത്",
        "ලද ලද ලද", "สนับสนุน สนับสนุน รับ สนับสนุน สนับสนุน",
        "ကြော်ငြာ ကြော်ငြာ", "ឧបត្ថម្ភ ឧបត្ថម្ភ ឧបត្ថម្ភ", "광고",
        "贊助", "赞助内容", "広告", "സ്‌പോൺസർ ചെയ്‌തത്",
        "Anzeige","Peye","Oglas"
    ];

    const specialChar = '󰞋';

    // Reel ads are never taken out of the reels list: Facebook keeps its own count of the reels in
    // it, and once nodes go missing it rebuilds the whole list and jumps to another reel mid-play.
    // An ad reel is only marked; CSS hides it and skipAdReels() scrolls past it when it comes up.
    function hideReel(s) {
        if (s.dataset.adHidden) return;
        s.dataset.adHidden = 'true';
        s.querySelectorAll('video').forEach(v => { v.muted = true; v.pause(); });
    }

    const style = document.createElement('style');
    style.textContent = 'div.vertically-snappable[data-ad-hidden] > *{visibility:hidden!important}' +
        'div.vertically-snappable[data-ad-hidden]{background:#000!important}';
    document.head.appendChild(style);

    const sponsoredRegex = new RegExp(`(${sponsoredTexts.join('|')})\\s*${specialChar}`, 'i');

    function hideSponsoredContent(config) {
        const { selector, textSelector } = config;
        const containers = document.querySelectorAll(selector);

        containers.forEach(container => {
            const spans = container.querySelectorAll(textSelector);
            for (const span of spans) {
                if (sponsoredRegex.test(span.textContent)) {
                    const snappable = container.closest('div.vertically-snappable');
                    if (snappable) {
                        hideReel(snappable);
                    } else {
                        container.style.display = 'none';
                    }
                    break;
                }
            }
        });
    }

    const configs = [
        {
            selector: 'div[data-type="vscroller"] div[data-tracking-duration-id]:has(> div[data-focusable="true"] div[data-mcomponent*="TextArea"] .native-text > span)',
            textSelector: '.native-text > span'
        },
        {
            selector: 'div[data-status-bar-color] > div[data-mcomponent="MContainer"] > div[data-mcomponent="MContainer"]',
            textSelector: 'div[data-mcomponent="TextArea"] .native-text > span'
        },
        {
            selector: 'div[data-mcomponent="MContainer"].m.bg-s3 div[data-mcomponent="MContainer"]',
            textSelector: 'div[data-mcomponent="TextArea"] .native-text > span'
        },
    ];

    function hideAllAds() { configs.forEach(hideSponsoredContent); }

    hideAllAds();

    const observer = new MutationObserver(hideAllAds);
    observer.observe(document.body, { childList: true, subtree: true });

    function containsSponsoredText(text) {
        const lowerText = text.toLowerCase();
        return sponsoredTexts.some(word => {
            const lowerWord = word.toLowerCase();
            // Use word boundary regex to match whole words only
            const wordBoundaryRegex = new RegExp(`\\b${lowerWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            return wordBoundaryRegex.test(lowerText);
        });
    }


    function removeReelAds(root = document) {
        const containers = root.querySelectorAll('div.vertically-snappable');

        containers.forEach((container) => {
            if (container.dataset.adHidden === 'true') return;

            if (container.querySelector('a[href*="/ads/about"]') ||
                container.querySelector('[aria-label="Sponsored"]')) {
                hideReel(container);
                return;
            }

            const spans = container.querySelectorAll('span');
            for (const span of spans) {
                if (containsSponsoredText(span.textContent)) {
                    hideReel(container);
                    return;
                }
            }
        });
    }

    // Initial cleanup
    removeReelAds();

    // Watch for dynamically added reel ads
    const reelObserver = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (!(node instanceof HTMLElement)) continue;

                // Check if the added node is a vertically-snappable container or contains one
                if (node.matches('div.vertically-snappable')) {
                    removeReelAds(node.parentElement || document);
                } else if (node.querySelector('div.vertically-snappable')) {
                    removeReelAds(node);
                }
            }
        }
    });

    reelObserver.observe(document.body, { childList: true, subtree: true });

    // The reel on screen: the one whose top is closest to the top of the list.
    function reelOnScreen(list) {
        const top = list.getBoundingClientRect().top;
        let best = null, bestDist = Infinity;
        for (const el of list.children) {
            if (!el.classList.contains('vertically-snappable')) continue;
            const d = Math.abs(el.getBoundingClientRect().top - top);
            if (d < bestDist) { bestDist = d; best = el; }
        }
        return bestDist < 40 ? best : null;   // null while a swipe is still moving
    }

    // A slot Facebook leaves empty (an unfilled ad) or one marked as an ad is skipped in the
    // direction the user is going. A slot only counts as empty after ~2s on screen, since
    // Facebook fills reels right as they come up.
    let lastReel = null, lastIndex = -1, goingBack = false, emptySince = 0;
    setInterval(() => {
        const list = document.querySelector('.vscroller-snap');
        const reel = list && reelOnScreen(list);
        if (!reel) return;
        const index = Array.prototype.indexOf.call(list.children, reel);
        if (reel !== lastReel) {
            if (lastReel && lastReel.isConnected) goingBack = index < lastIndex;
            lastReel = reel;
            emptySince = 0;
        }
        lastIndex = index;

        let skip = !!reel.dataset.adHidden;
        if (!skip && (reel.innerHTML.length === 0 || !reel.querySelector('video, img'))) {
            if (!emptySince) emptySince = Date.now();
            skip = Date.now() - emptySince > 2000;
        } else if (!skip) {
            emptySince = 0;
        }
        if (!skip) return;

        // Only to another reel that is not an ad; the list also holds hidden helper elements.
        // The last slot is Facebook's own "loading more" spinner, so with nothing after it, wait.
        const find = (back) => {
            let el = reel;
            do el = back ? el.previousElementSibling : el.nextElementSibling;
            while (el && (!el.classList.contains('vertically-snappable') || el.dataset.adHidden));
            return el;
        };
        const next = find(goingBack) || (goingBack ? find(false) : null);
        if (next) next.scrollIntoView({ block: 'start' });
    }, 300);
})();
