module.exports = {
  moduleFileExtensions: ['js', 'jsx', 'json', 'vue'],
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testEnvironment: 'jsdom',
  testMatch: [
    '**/tests/unit/**/*.spec.[jt]s?(x)',
    '**/__tests__/*.[jt]s?(x)'
  ],
  transformIgnorePatterns: ['/node_modules/'],
  setupFiles: ['<rootDir>/tests/unit/setup.js'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  }
}; 