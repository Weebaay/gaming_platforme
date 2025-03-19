import { config } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';

// Configuration globale pour Vue Test Utils
config.global.mocks = {
  $router: createRouter({
    history: createWebHistory(),
    routes: []
  })
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock alert
global.alert = jest.fn();

// Mock console methods
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}; 