import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended'),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...{
          Dialog: 'readonly',
          ui: 'readonly',
          game: 'readonly',
          foundry: 'readonly',
          Hooks: 'readonly',
          loadTemplates: 'readonly',
          renderTemplate: 'readonly',
          Handlebars: 'readonly',
          canvas: 'readonly',
          Application: 'readonly',
        },
        $: 'readonly',
      },

      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },

    settings: {},

    rules: {
      'indent': ['error', 2],
      'linebreak-style': ['error', 'unix'],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'curly': ['error', 'all'],
      'quote-props': ['error', 'consistent-as-needed', {
        keywords: true,
      }],
      'no-unused-vars': ['off'],
      '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_', args: 'after-used'}],
    },
  },
  {
    files: ['**/*.js', '**/*.d.ts'],

    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
];