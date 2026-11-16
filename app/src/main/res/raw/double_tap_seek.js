// Double tap on the left / right part of a video to skip back / forward 10 seconds, like the
// official YouTube / Facebook players. The middle part keeps Facebook's own double tap (like).
//
// Facebook pauses the video on the very first tap (its click handler), so a plain double tap
// would pause, seek, then resume: a visible freeze. So in the seek zones the first tap's click is
// held back until it is clear whether a second tap follows. If one does, only the seek happens;
// if not, the held click is replayed to Facebook (a single tap then reacts after DOUBLE_MS).
(function() {
    if (window._nbDoubleTapSeek) return;
    window._nbDoubleTapSeek = true;

    const STEP = 10;
    const DOUBLE_MS = 260;      // max time between the two taps
    const TAP_MAX_MS = 250;     // a tap is shorter than this ...
    const TAP_SLOP = 14;        // ... and barely moves
    const DOUBLE_SLOP = 60;     // the two taps land close together
    const SIDE = 0.38;          // left / right 38% of the video are the seek zones
    const FEEDBACK_ID = 'nb-seek-feedback';

    let down = null;            // current touch
    let candidate = null;       // tap just released in a seek zone; its click is about to arrive
    let held = null;            // first tap whose click is held back: { timer, x, y, side, video, target }
    let replaying = false;
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

    // Give the held click back to Facebook: a plain single tap.
    const replay = (h) => {
        if (held === h) held = null;
        const target = h.target.isConnected ? h.target : h.video;
        replaying = true;
        try {
            target.dispatchEvent(new MouseEvent('click', {
                bubbles: true, cancelable: true, view: window, clientX: h.x, clientY: h.y
            }));
        } finally {
            replaying = false;
        }
    };

    document.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) { down = null; candidate = null; return; }
        const t = e.touches[0];
        const video = videoAt(t.clientX, t.clientY);
        down = video ? { x: t.clientX, y: t.clientY, time: Date.now(), video, target: e.target, moved: false } : null;
    }, { passive: true, capture: true });

    document.addEventListener('touchmove', (e) => {
        if (!down) return;
        const t = e.touches[0];
        if (Math.abs(t.clientX - down.x) > TAP_SLOP || Math.abs(t.clientY - down.y) > TAP_SLOP) down.moved = true;
    }, { passive: true, capture: true });

    document.addEventListener('touchend', () => {
        const d = down;
        down = null;
        candidate = null;
        if (!d || d.moved || Date.now() - d.time > TAP_MAX_MS) return;
        if (onSmallControl(d.target, d.video)) return;

        const r = d.video.getBoundingClientRect();
        const frac = (d.x - r.left) / r.width;
        const side = frac <= SIDE ? -1 : frac >= 1 - SIDE ? 1 : 0;
        if (side === 0) return;

        const now = Date.now();
        const isDouble = held && held.video === d.video && held.side === side &&
            Math.abs(d.x - held.x) < DOUBLE_SLOP && Math.abs(d.y - held.y) < DOUBLE_SLOP;
        if (!isDouble) {
            // First tap: its click (arriving next) is held back.
            candidate = { x: d.x, y: d.y, side, video: d.video, target: d.target, time: now };
            return;
        }

        // Second tap: Facebook never saw the first one, so just seek.
        clearTimeout(held.timer);
        held = null;
        const v = d.video;
        if (v.duration && isFinite(v.duration)) {
            v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + side * STEP));
        }
        showFeedback(d.x, d.y, side > 0);
        if (navigator.vibrate) navigator.vibrate(10);
        swallowClickUntil = now + 500;
    }, { passive: true, capture: true });

    document.addEventListener('click', (e) => {
        if (replaying) return;
        const now = Date.now();
        if (now < swallowClickUntil) {            // click of the second tap
            e.stopPropagation();
            e.preventDefault();
            return;
        }
        if (candidate && now - candidate.time < 400) {   // click of a first tap: hold it back
            const c = candidate;
            candidate = null;
            e.stopPropagation();
            e.preventDefault();
            const h = { x: c.x, y: c.y, side: c.side, video: c.video, target: c.target };
            h.timer = setTimeout(() => replay(h), DOUBLE_MS);
            held = h;
        }
    }, true);
})();
