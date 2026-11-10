// Reel / video controls: progress bar with visible thumb at the bottom.
(function() {
    if (window._nbReelControls) return;
    window._nbReelControls = true;

    const BAR_ID = 'nb-reel-bar';

    const currentVideo = () => {
        let best = null, bestScore = -1;
        const vp = window.innerWidth * window.innerHeight;
        document.querySelectorAll('video').forEach((v) => {
            const r = v.getBoundingClientRect();
            const w = Math.min(r.right, window.innerWidth)  - Math.max(r.left, 0);
            const h = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
            const area = (w > 0 && h > 0) ? w * h : 0;
            // Require video to cover ≥60% of viewport — filters out feed post videos.
            // In landscape a reel is scaled to the screen height (see fitLandscape), so
            // there it only has to fill most of the height.
            const landscape = window.innerWidth > window.innerHeight;
            if (landscape ? h < window.innerHeight * 0.6 : area / vp < 0.6) return;
            if (area > bestScore) { bestScore = area; best = v; }
        });
        return best;
    };

    let dragging = false;

    const build = () => {
        // Outer div is the 24px touch target (transparent background), flush with the bottom of
        // the screen. The 8px side inset is just enough for the 14px thumb to stay on screen at
        // 0% and 100%.
        const bar = document.createElement('div');
        bar.id = BAR_ID;
        bar.setAttribute('style', [
            'position:fixed', 'left:8px', 'right:8px', 'bottom:0',
            'z-index:2147483647', 'display:none',
            'height:24px', 'background:transparent',
            'cursor:pointer', 'touch-action:none'
        ].join(';'));

        // Visual track (dim white strip), as low as it can go while the thumb (centred on it)
        // still ends exactly at the screen edge.
        const track = document.createElement('div');
        track.setAttribute('style', [
            'position:absolute', 'left:0', 'right:0', 'bottom:5px',
            'height:4px', 'background:rgba(255,255,255,0.3)',
            'pointer-events:none'
        ].join(';'));

        // Filled portion showing progress.
        const barFill = document.createElement('div');
        barFill.setAttribute('style', [
            'position:absolute', 'left:0', 'bottom:5px',
            'height:4px', 'width:0%', 'background:rgba(255,255,255,0.9)',
            'transition:width 0.25s linear', 'pointer-events:none'
        ].join(';'));

        // Thumb: white circle at current position.
        const thumb = document.createElement('div');
        thumb.setAttribute('style', [
            'position:absolute', 'bottom:0', 'left:0%',
            'width:14px', 'height:14px', 'background:white',
            'border-radius:50%', 'transform:translateX(-50%)',
            'box-shadow:0 1px 4px rgba(0,0,0,0.5)',
            'transition:left 0.25s linear', 'pointer-events:none'
        ].join(';'));

        bar.appendChild(track);
        bar.appendChild(barFill);
        bar.appendChild(thumb);
        document.body.appendChild(bar);

        const barFrac = (e) => {
            const r = bar.getBoundingClientRect();
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            return Math.max(0, Math.min(1, (cx - r.left) / r.width));
        };

        const seekTo = (frac, v) => {
            const pct = (frac * 100).toFixed(2) + '%';
            barFill.style.transition = 'none';
            thumb.style.transition = 'none';
            barFill.style.width = pct;
            thumb.style.left = pct;
            if (v && v.duration) v.currentTime = frac * v.duration;
        };

        bar.addEventListener('click', (e) => {
            seekTo(barFrac(e), currentVideo());
        });

        bar.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            dragging = true;
            seekTo(barFrac(e), currentVideo());
        }, { passive: false });

        bar.addEventListener('touchmove', (e) => {
            e.stopPropagation();
            e.preventDefault();
            seekTo(barFrac(e), currentVideo());
        }, { passive: false });

        bar.addEventListener('touchend', (e) => {
            e.stopPropagation();
            dragging = false;
            barFill.style.transition = 'width 0.25s linear';
            thumb.style.transition = 'left 0.25s linear';
        }, { passive: false });

        return { bar, barFill, thumb };
    };

    let ui = null;

    const tick = () => {
        if (!document.body) return;
        if (!ui || !document.getElementById(BAR_ID)) ui = build();

        const v = currentVideo();
        ui.bar.style.display = v ? 'block' : 'none';

        if (!v || dragging) return;

        // Span the reel itself, which in landscape is narrower than the screen.
        const vr = v.getBoundingClientRect();
        const landscape = window.innerWidth > window.innerHeight;
        ui.bar.style.left = (landscape ? Math.max(0, vr.left) + 8 : 8) + 'px';
        ui.bar.style.right = (landscape ? Math.max(0, window.innerWidth - vr.right) + 8 : 8) + 'px';

        const d = v.duration || 0;
        const pct = d ? ((v.currentTime / d) * 100).toFixed(2) + '%' : '0%';
        ui.barFill.style.width = pct;
        ui.thumb.style.left = pct;
    };

    setInterval(tick, 250);

    // Keep the same reel when the screen rotates. On a resize Facebook redraws the reels page
    // with a fresh set of reels, so remember the video_id of the reel on screen and, if a
    // different one is showing after the rotation, open the remembered one by its URL.
    const LIST = '.vscroller-snap';
    const ITEM = ':scope > .vertically-snappable';
    const ids = new WeakMap();   // reel element -> video_id (read once per element)
    let shownId = null;
    let resizedAt = 0;

    const onReelsPage = () => location.pathname.startsWith('/reel');

    const reelIdOnScreen = () => {
        const list = document.querySelector(LIST);
        if (!list) return null;
        const top = list.getBoundingClientRect().top;
        let item = null, bestDist = Infinity;
        list.querySelectorAll(ITEM).forEach((el) => {
            const d = Math.abs(el.getBoundingClientRect().top - top);
            if (d < bestDist) { bestDist = d; item = el; }
        });
        if (!item) return null;
        if (!ids.has(item)) {
            // The reel's data sits in attributes as JSON, so quotes appear as &quot; in outerHTML.
            const m = item.outerHTML.match(/video_id(?:&quot;|")\s*:\s*(?:&quot;|")(\d+)/);
            if (!m) return null;
            ids.set(item, m[1]);
        }
        return ids.get(item);
    };

    setInterval(() => {
        // Positions are in flux right after a resize; keep the reel from before it.
        if (!onReelsPage() || Date.now() - resizedAt < 2500) return;
        shownId = reelIdOnScreen() || shownId;
    }, 300);

    // Landscape: Facebook always lays the reels page out as a tall portrait screen, so most of
    // the reel is cut off. Scale that screen down so its height matches the screen height (the
    // phone's width) and centre it, keeping the reel's proportions. Undone in portrait.
    const fitLandscape = () => {
        const list = document.querySelector(LIST);
        const root = list && list.closest('body > div > div');
        if (!root) return;
        const backdrop = root.parentElement;
        const want = onReelsPage() && window.innerWidth > window.innerHeight;
        if (!want) {
            if (root.dataset.nbFit) {
                root.style.transform = '';
                root.style.transformOrigin = '';
                backdrop.style.background = '';
                delete root.dataset.nbFit;
            }
            return;
        }
        const w = root.offsetWidth, h = root.offsetHeight;   // untransformed size
        if (!w || !h) return;
        const s = Math.min(1, window.innerHeight / h);
        const x = Math.max(0, (window.innerWidth - w * s) / 2);
        const t = `translateX(${x.toFixed(1)}px) scale(${s.toFixed(4)})`;
        if (root.style.transform !== t) {
            root.style.transformOrigin = '0 0';
            root.style.transform = t;
            backdrop.style.background = '#000';
            root.dataset.nbFit = '1';
        }
    };
    // True when Facebook drew the reels page for the wide screen instead of as a portrait screen.
    const laidOutLandscape = () => {
        const list = document.querySelector(LIST);
        const root = list && list.closest('body > div > div');
        return !!root && window.innerWidth > window.innerHeight && root.offsetWidth > root.offsetHeight;
    };

    setInterval(fitLandscape, 250);
    window.addEventListener('resize', fitLandscape);

    // Facebook removes the list ~1s after the resize and builds the new one ~2-3s later, so wait
    // for the new list (up to 10s) before comparing.
    let watcher = null;
    window.addEventListener('resize', () => {
        if (!onReelsPage() || !shownId) return;
        resizedAt = Date.now();
        if (watcher) return;           // rotation fires several resize events
        const wanted = shownId;
        const start = Date.now();
        let listGone = false;
        watcher = setInterval(() => {
            const elapsed = Date.now() - start;
            const now = reelIdOnScreen();
            if (!now) listGone = true;
            const settled = now && (listGone || elapsed > 2000);
            if (settled || elapsed > 10000) {
                clearInterval(watcher);
                watcher = null;
                if (!onReelsPage()) return;
                if (now && now !== wanted) {
                    location.href = 'https://www.facebook.com/reel/' + wanted;
                } else if (laidOutLandscape()) {
                    // A reel opened from the feed is redrawn for the wide screen: the video
                    // fills the width and is cut off, and fitLandscape() cannot shrink it. Loaded
                    // anew, the page comes back in the portrait layout, which it can.
                    let last = 0;
                    try { last = +sessionStorage.getItem('nbFitReload') || 0; } catch (e) {}
                    if (Date.now() - last < 15000) return;   // never loop
                    try { sessionStorage.setItem('nbFitReload', String(Date.now())); } catch (e) {}
                    location.href = 'https://www.facebook.com/reel/' + wanted;
                }
            }
        }, 250);
    });
})();
