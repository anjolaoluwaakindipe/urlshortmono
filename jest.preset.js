const nxPreset = require('@nrwl/jest/preset').default;

module.exports = {
  ...nxPreset,
  coverageReporters: ['cobertura', 'lcov', 'text'],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 90,
      statements: 90,
    },
  },
};
