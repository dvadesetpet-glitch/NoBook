// Floating back button on all Messenger pages, same position as the
// "Remove all" button on the Friends page (right:12px, bottom:72px).
(function() {
    if (window._nbMessengerBack) return;
    window._nbMessengerBack = true;

    const BTN_ID = 'nb-messenger-back';
    const HOME_URL = 'https://m.facebook.com/';
    const MESSAGES_URL = 'https://www.facebook.com/messages/';

    const onMessengerPage = () =>
        location.pathname.startsWith('/messages') || location.pathname.startsWith('/t/');

    // An open conversation: /messages/t/<id> or /t/<id>
    const inChat = () => /^\/(messages\/)?t\//.test(location.pathname);

    // Material "arrow back" icon, drawn rather than typed so it is centred and crisp.
    const ICON =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" ' +
        'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';

    const css = `
        #${BTN_ID} {
            position: fixed; right: 12px; bottom: 72px; z-index: 2147483647;
            width: 48px; height: 48px; padding: 0; border: none; border-radius: 50%;
            display: none; align-items: center; justify-content: center;
            background: linear-gradient(135deg, #0a7cff 0%, #a033ff 100%);
            box-shadow: 0 4px 14px rgba(10, 124, 255, 0.35), 0 1px 3px rgba(0, 0, 0, 0.3);
            cursor: pointer; -webkit-tap-highlight-color: transparent;
            transition: transform 0.12s ease, box-shadow 0.12s ease;
        }
        #${BTN_ID}.nb-show { display: flex; }
        #${BTN_ID}:active {
            transform: scale(0.92);
            box-shadow: 0 2px 6px rgba(10, 124, 255, 0.3), 0 1px 2px rgba(0, 0, 0, 0.3);
        }
    `;

    const build = () => {
        if (!document.getElementById(BTN_ID + '-style')) {
            const style = document.createElement('style');
            style.id = BTN_ID + '-style';
            style.textContent = css;
            (document.head || document.documentElement).appendChild(style);
        }
        const b = document.createElement('button');
        b.id = BTN_ID;
        b.setAttribute('aria-label', 'Back');
        b.innerHTML = ICON;
        // In a chat: go back to the chat list. Anywhere else in Messenger: leave for the feed, like
        // the system back key. Plain history.back() is unreliable here, since the previous entry is
        // often another Messenger page (e.g. /messages/ loaded twice when opened from a link).
        b.addEventListener('click', (e) => {
            e.stopPropagation();
            if (inChat()) {
                const before = location.href;
                history.back();
                setTimeout(() => {
                    if (location.href === before) location.href = MESSAGES_URL;
                }, 400);
            } else {
                location.href = HOME_URL;
            }
        });
        document.body.appendChild(b);
        return b;
    };

    let btn = null;

    const tick = () => {
        if (!document.body) return;
        if (!btn || !document.getElementById(BTN_ID)) btn = build();
        btn.classList.toggle('nb-show', onMessengerPage());
    };

    setInterval(tick, 500);
})();
