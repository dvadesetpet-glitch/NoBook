// Floating back button on all Messenger pages, same position as the
// "Remove all" button on the Friends page (right:12px, bottom:72px).
(function() {
    if (window._nbMessengerBack) return;
    window._nbMessengerBack = true;

    const BTN_ID = 'nb-messenger-back';

    const onMessengerPage = () =>
        location.pathname.startsWith('/messages') || location.pathname.startsWith('/t/');

    const build = () => {
        const b = document.createElement('button');
        b.id = BTN_ID;
        b.textContent = '←';
        b.setAttribute('style', [
            'position:fixed', 'right:12px', 'bottom:72px', 'z-index:2147483647',
            'width:44px', 'height:44px', 'padding:0', 'border:none', 'border-radius:50%',
            'background:#0084ff', 'color:#fff', 'font:bold 24px sans-serif',
            'box-shadow:0 2px 8px rgba(0,0,0,0.4)', 'display:none',
            'cursor:pointer', 'line-height:44px', 'text-align:center'
        ].join(';'));
        b.addEventListener('click', (e) => {
            e.stopPropagation();
            history.back();
        });
        document.body.appendChild(b);
        return b;
    };

    let btn = null;

    const tick = () => {
        if (!document.body) return;
        if (!btn || !document.getElementById(BTN_ID)) btn = build();
        btn.style.display = onMessengerPage() ? 'block' : 'none';
    };

    setInterval(tick, 500);
})();
