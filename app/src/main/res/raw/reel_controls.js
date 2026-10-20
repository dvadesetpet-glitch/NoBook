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
            if (area / vp < 0.6) return;
            if (area > bestScore) { bestScore = area; best = v; }
        });
        return best;
    };

    let dragging = false;

    const build = () => {
        // Outer div is the 24px touch target (transparent background).
        const bar = document.createElement('div');
        bar.id = BAR_ID;
        bar.setAttribute('style', [
            'position:fixed', 'left:0', 'right:0', 'bottom:0',
            'z-index:2147483647', 'display:none',
            'height:24px', 'background:transparent',
            'cursor:pointer', 'touch-action:none'
        ].join(';'));

        // Visual track (dim white strip).
        const track = document.createElement('div');
        track.setAttribute('style', [
            'position:absolute', 'left:0', 'right:0', 'bottom:8px',
            'height:4px', 'background:rgba(255,255,255,0.3)',
            'pointer-events:none'
        ].join(';'));

        // Filled portion showing progress.
        const barFill = document.createElement('div');
        barFill.setAttribute('style', [
            'position:absolute', 'left:0', 'bottom:8px',
            'height:4px', 'width:0%', 'background:rgba(255,255,255,0.9)',
            'transition:width 0.25s linear', 'pointer-events:none'
        ].join(';'));

        // Thumb: white circle at current position.
        const thumb = document.createElement('div');
        thumb.setAttribute('style', [
            'position:absolute', 'bottom:3px', 'left:0%',
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

    const isStory = () => location.pathname.includes('/stories/');

    let ui = null;

    const tick = () => {
        if (!document.body) return;
        if (!ui || !document.getElementById(BAR_ID)) ui = build();

        const v = currentVideo();
        ui.bar.style.display = v ? 'block' : 'none';

        if (!dragging) {
            ui.bar.style.bottom = isStory() ? '56px' : '0';
        }

        if (!v || dragging) return;

        const d = v.duration || 0;
        const pct = d ? ((v.currentTime / d) * 100).toFixed(2) + '%' : '0%';
        ui.barFill.style.width = pct;
        ui.thumb.style.left = pct;
    };

    setInterval(tick, 250);
})();
