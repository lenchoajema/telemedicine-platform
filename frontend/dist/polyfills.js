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
