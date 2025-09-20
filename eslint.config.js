import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '*.cjs', 'debug-*.cjs'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Stricter TypeScript rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-empty-function': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off', // Too verbose for React components
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Too verbose for React components

      // General code quality rules
      'no-empty': 'error',
      'no-console': 'off', // Allow console for development/debug code
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': 'error',
      'no-debugger': 'error',

      // React specific rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  }
)
