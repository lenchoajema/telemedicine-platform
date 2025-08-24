// Polyfills for Node.js globals in browser environment
if (typeof global === 'undefined') {
  window.global = window;
}

if (typeof process === 'undefined') {
  window.process = {
    env: {},
    nextTick: (fn) => setTimeout(fn, 0),
    version: '',
    versions: {
      node: ''
    }
  };
}

if (typeof Buffer === 'undefined') {
  window.Buffer = {
    from: (data) => new Uint8Array(data),
    isBuffer: () => false
  };
}

// Prevent service worker registration inside VS Code webviews (Simple Browser)
// VS Code webviews do not allow registering service workers and can throw InvalidStateError.
// This safely no-ops navigator.serviceWorker.register when detected, without affecting normal browsers.
try {
  const ua = navigator.userAgent || '';
  const inVsCodeWebview = ua.includes('vscode-webview');
  if (inVsCodeWebview && 'serviceWorker' in navigator) {
    const sw = navigator.serviceWorker;
    if (sw && typeof sw.register === 'function') {
      const noopRegistration = Promise.resolve({
        update: () => {},
        unregister: () => Promise.resolve(true)
      });
      // eslint-disable-next-line no-self-assign
      sw.register = function () { return noopRegistration; };
    }
  }
} catch (_) {
  // Ignore detection/patch errors; this is a best-effort guard for VS Code's Simple Browser.
}
