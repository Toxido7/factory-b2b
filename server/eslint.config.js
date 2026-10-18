import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['node_modules/'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_|^next$' }],
      'no-console': 'warn',
      eqeqeq: 'error',
      'prefer-const': 'error',
    },
  },
  {
    // env.js runs before the logger exists, so console is correct there
    files: ['src/config/env.js'],
    rules: { 'no-console': 'off' },
  },
  prettier,
];
