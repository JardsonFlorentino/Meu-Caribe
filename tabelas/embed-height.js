(function () {
  var scheduled = false;

  function ensureMarker() {
    try {
      var marker = document.getElementById('__tabela_mares_height_marker');
      if (marker) return marker;
      marker = document.createElement('div');
      marker.id = '__tabela_mares_height_marker';
      marker.setAttribute('aria-hidden', 'true');
      marker.style.cssText = 'width:100%;height:0;overflow:hidden;';
      (document.body || document.documentElement).appendChild(marker);
      return marker;
    } catch (_) {
      return null;
    }
  }

  function postHeight() {
    try {
      if (!window.parent || window.parent === window) return;

      // Use a marker at the end of the document to avoid a feedback loop:
      // scrollHeight is never smaller than the viewport, so if the parent
      // sets a larger iframe height (with padding), it can keep growing.
      var marker = ensureMarker();
      var height = 0;
      if (marker && marker.getBoundingClientRect) {
        var rect = marker.getBoundingClientRect();
        height = Math.ceil(rect.bottom);
      }

      if (!height || !Number.isFinite(height)) {
        height = Math.max(
          document.body ? document.body.scrollHeight : 0,
          document.documentElement ? document.documentElement.scrollHeight : 0
        );
      }
      window.parent.postMessage({ type: 'tabela-mares:height', height: height }, window.location.origin);
    } catch (_) {
      // silencioso
    }
  }

  function requestPostHeight() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () {
      scheduled = false;
      postHeight();
    }, 50);
  }

  function schedule() {
    postHeight();
    setTimeout(postHeight, 150);
    setTimeout(postHeight, 600);
  }

  window.addEventListener('load', schedule);
  window.addEventListener('resize', postHeight);

  // Para tabelas que renderizam conteúdo após o load (ex.: via fetch de JSON local)
  if (window.MutationObserver) {
    try {
      var target = document.body || document.documentElement;
      if (target) {
        var obs = new MutationObserver(requestPostHeight);
        obs.observe(target, { childList: true, subtree: true, characterData: true });
      }
    } catch (_) {
      // silencioso
    }
  }

  if (document.fonts && typeof document.fonts.ready === 'object' && typeof document.fonts.ready.then === 'function') {
    document.fonts.ready.then(postHeight).catch(function () { });
  }
})();
