// Change the setup.js file to use CommonJS syntax
require('@testing-library/jest-dom');

// Mock the Intersection Observer which is used by some React components
class IntersectionObserver {
  constructor() {}

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

// Suppress React 18 console errors/warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  if (/Warning.*not wrapped in act/.test(args[0])) {
    return;
  }
  originalConsoleError(...args);
};
