/* eslint-disable */
export default {
  displayName: 'api-urlservice-url',
  preset: '../../../../jest.preset.js',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../../coverage/libs/api/urlservice/url',
  coverageReporters: ["cobertura", "lcov", "text"],
};
