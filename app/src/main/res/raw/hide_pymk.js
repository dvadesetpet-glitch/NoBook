// Hide "People You May Know" suggestions on the Facebook search page
(function() {
  const hidePymk = () => {
    if (!window.location.href.includes('facebook.com/search/')) return;
    
    const imgArea = document.querySelector('[data-mcomponent="ImageArea"]');
    const suggCont = imgArea?.nextElementSibling;

    if (suggCont) suggCont.style.display = 'none';
  };

  window.__nb.onScan(hidePymk);
})();


// Hide "People You May Know" suggestions in the main feed
(() => {
  const hidePymk = (nodes) => {
    if (window.location.pathname !== '/') return;
    nodes.forEach(node => {
      if (!(node instanceof HTMLElement)) return;
      const targets = node.matches('.hscroller') ? [node] : node.querySelectorAll?.('.hscroller') || [];
      targets.forEach(el => el.closest('[data-tracking-duration-id]')?.style.setProperty('display', 'none'));
    });
  };

  hidePymk([document.body]);
  window.__nb.onAdd(nodes => hidePymk(nodes));
})();
