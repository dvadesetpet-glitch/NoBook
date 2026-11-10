// Story reply bar: Facebook lays out 7 quick reactions at 49px each next to a wide
// "Send message..." pill, so on a phone most of them end up off screen. This shrinks the
// reactions to 32px, lines them up in a row at the right edge, and narrows the pill so
// everything fits. Selectors use the layout (pill + a row of 5+ image buttons), not the
// aria-labels, so it works in every language.
(function() {
    if (window._nbStoryReactions) return;
    window._nbStoryReactions = true;

    const BTN = 32;            // width of one reaction button
    const ROW = BTN * 7;       // all seven reactions
    const GAP = 6;             // space after the pill and at the right edge

    const BAR = '.hscroller:has(> div.nb):has(> div > div[role=button]:nth-child(5) img)';
    const ROW_SEL = `${BAR} > div:has(> div[role=button]:nth-child(5) img)`;

    const css = `
        ${ROW_SEL} {
            flex-direction: row !important;
            width: ${ROW}px !important;
            margin-left: calc(100% - ${ROW + GAP}px) !important;
        }
        ${ROW_SEL} > div[role=button] {
            margin: 0 !important;
            width: ${BTN}px !important;
            align-items: center !important;
            justify-content: center !important;
        }
        ${ROW_SEL} > div[role=button] > div,
        ${ROW_SEL} > div[role=button] img {
            width: ${BTN - 4}px !important;
            height: ${BTN - 4}px !important;
        }
        ${BAR} > div.nb {
            width: calc(100% - 14px - ${ROW + GAP * 2}px) !important;
        }
        ${BAR} > div.nb > div.bg-s1 {
            width: calc(100% - 2px) !important;
        }
        ${BAR} > div.nb > div.bg-s1 > div {
            width: calc(100% - 24px) !important;
        }
    `;

    const style = document.createElement('style');
    style.id = 'nb-story-reactions';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
})();
