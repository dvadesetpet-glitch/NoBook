// Double tap on the left / right part of a video to skip back / forward 10 seconds, like the
// official YouTube / Facebook players. The middle part keeps Facebook's own double tap (like).
(function() {
    if (window._nbDoubleTapSeek) return;
    window._nbDoubleTapSeek = true;

    const STEP = 10;
    const DOUBLE_MS = 300;      // max time between the two taps
    const TAP_MAX_MS = 250;     // a tap is shorter than this ...
    const TAP_SLOP = 14;        // ... and barely moves
    const DOUBLE_SLOP = 60;     // the two taps land close together
    const SIDE = 0.38;          // left / right 38% of the video are the seek zones
    const FEEDBACK_ID = 'nb-seek-feedback';

    let down = null;            // current touch
    let last = null;            // previous completed tap
    let swallowClickUntil = 0;

    // The video under the finger, if it is big enough to be a player (not a thumbnail or an ad strip).
    const videoAt = (x, y) => {
        let found = null;
        document.querySelectorAll('video').forEach((v) => {
            const r = v.getBoundingClientRect();
            if (r.width < 200 || r.height < 120) return;
            if (x < r.left || x > r.right || y < r.top || y > r.top + r.height * 0.85) return;
            found = v;
        });
        return found;
    };

    // A small button drawn on top of the video (like / comment / mute / progress bar) is not a seek.
    const onSmallControl = (target, video) => {
        const vr = video.getBoundingClientRect();
        const videoArea = vr.width * vr.height;
        for (let el = target; el && el !== document.body; el = el.parentElement) {
            if (el.contains(video)) return false;
            if (el.matches && el.matches('a, button, input, [role="button"], [role="slider"]')) {
                const r = el.getBoundingClientRect();
                if (r.width * r.height < videoArea * 0.3) return true;
            }
        }
        return false;
    };

    const showFeedback = (x, y, forward) => {
        let el = document.getElementById(FEEDBACK_ID);
        if (!el) {
            el = document.createElement('div');
            el.id = FEEDBACK_ID;
            document.body.appendChild(el);
        }
        el.textContent = (forward ? '+' : '−') + STEP + 's';
        el.setAttribute('style', [
            'position:fixed', 'left:' + x + 'px', 'top:' + y + 'px', 'transform:translate(-50%,-50%)',
            'padding:10px 16px', 'border-radius:22px', 'background:rgba(0,0,0,0.65)', 'color:#fff',
            'font:600 16px sans-serif', 'z-index:2147483646', 'pointer-events:none',
            'transition:opacity 0.25s', 'opacity:1'
        ].join(';'));
        clearTimeout(el._t);
        el._t = setTimeout(() => { el.style.opacity = '0'; }, 550);
    };

    document.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) { down = null; last = null; return; }
        const t = e.touches[0];
        const video = videoAt(t.clientX, t.clientY);
        down = video ? {
            x: t.clientX, y: t.clientY, time: Date.now(), video, target: e.target,
            wasPaused: video.paused, moved: false
        } : null;
    }, { passive: true, capture: true });

    document.addEventListener('touchmove', (e) => {
        if (!down) return;
        const t = e.touches[0];
        if (Math.abs(t.clientX - down.x) > TAP_SLOP || Math.abs(t.clientY - down.y) > TAP_SLOP) down.moved = true;
    }, { passive: true, capture: true });

    document.addEventListener('touchend', () => {
        const d = down;
        down = null;
        if (!d || d.moved || Date.now() - d.time > TAP_MAX_MS) { last = null; return; }
        if (onSmallControl(d.target, d.video)) { last = null; return; }

        const r = d.video.getBoundingClientRect();
        const frac = (d.x - r.left) / r.width;
        const side = frac <= SIDE ? -1 : frac >= 1 - SIDE ? 1 : 0;
        if (side === 0) { last = null; return; }

        const now = Date.now();
        const isDouble = last && last.video === d.video && last.side === side &&
            now - last.time < DOUBLE_MS &&
            Math.abs(d.x - last.x) < DOUBLE_SLOP && Math.abs(d.y - last.y) < DOUBLE_SLOP;
        if (!isDouble) {
            last = { time: now, x: d.x, y: d.y, side, video: d.video, wasPaused: d.wasPaused };
            return;
        }

        // Second tap: seek, and undo what the two taps would otherwise do (pause / resume).
        const v = d.video;
        const wasPaused = last.wasPaused;
        last = null;
        if (v.duration && isFinite(v.duration)) {
            v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + side * STEP));
        }
        showFeedback(d.x, d.y, side > 0);
        if (navigator.vibrate) navigator.vibrate(10);
        swallowClickUntil = now + 500;
        const restore = () => {
            if (v.paused !== wasPaused) {
                if (wasPaused) v.pause(); else v.play().catch(() => {});
            }
        };
        setTimeout(restore, 60);
        setTimeout(restore, 350);
    }, { passive: true, capture: true });

    // The second tap must not reach Facebook as a click (it would toggle playback again).
    document.addEventListener('click', (e) => {
        if (Date.now() < swallowClickUntil) {
            e.stopPropagation();
            e.preventDefault();
        }
    }, true);
})();
