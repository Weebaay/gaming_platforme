import { config } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';

// Configuration globale pour Vue Test Utils
config.global.mocks = {
  $router: createRouter({
    history: createWebHistory(),
    routes: []
  })
};

// Mock localStorage de manière plus complète
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn(index => {
      return Object.keys(store)[index] || null;
    }),
    length: jest.fn(() => Object.keys(store).length)
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock pour les alertes et confirmations
global.alert = jest.fn();
global.confirm = jest.fn(() => true);

// Mock des fonctions console
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}; 