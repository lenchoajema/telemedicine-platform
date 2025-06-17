import '@testing-library/jest-dom';

// Mock the Intersection Observer which is used by some React components
class IntersectionObserver {
  constructor() {}
<<<<<<< HEAD
  
  disconnect() {}
  
  observe() {}
  
  takeRecords() { return []; }
  
  unobserve() {}
}

window.IntersectionObserver = IntersectionObserver;

// Mock fetch API
global.fetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
    status: 200,
  })
);

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock;
=======
  disconnect() {}
  observe() {}
  takeRecords() { return []; }
  unobserve() {}
}

if (typeof window !== 'undefined') {
  window.IntersectionObserver = IntersectionObserver;
}

// Mock fetch API
if (typeof global !== 'undefined') {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({}),
    })
  );

  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  global.localStorage = localStorageMock;
}
>>>>>>> a67abca257d39517a26d636c680d417d5adda03f

// Suppress React 18 console errors/warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  if (/Warning.*not wrapped in act/.test(args[0])) {
    return;
  }
  originalConsoleError(...args);
};
<<<<<<< HEAD
=======

import { TextEncoder, TextDecoder } from 'util';
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
>>>>>>> a67abca257d39517a26d636c680d417d5adda03f
