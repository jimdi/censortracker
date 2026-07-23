const js = require('@eslint/js')
const globals = require('globals')
const jestPlugin = require('eslint-plugin-jest')
const simpleImportSort = require('eslint-plugin-simple-import-sort')
const importPlugin = require('eslint-plugin-import')
const babelParser = require('@babel/eslint-parser')

module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**', 'webpack.config.js'],
  },

  js.configs.recommended,

  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-env'],
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        chrome: 'readonly',
        browser: 'readonly',
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
      import: importPlugin,
      jest: jestPlugin,
    },
    rules: {
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        caughtErrors: 'none',
        destructuredArrayIgnorePattern: '^_',
      }],
      'max-len': [
        'warn',
        {
          code: 150,
          ignoreComments: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
        },
      ],
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/no-cycle': 'off',
      'import/no-default-export': 'off',
      'no-param-reassign': 'off',
      'prefer-rest-params': 'off',
      'prefer-destructuring': 'off',
      'no-underscore-dangle': 'off',
      'class-methods-use-this': 'off',
      'no-console': 'off',
      'no-continue': 'off',
      'no-magic-numbers': 'off',
      'no-restricted-globals': 'off',
      'new-cap': 'off',
      'brace-style': [2, '1tbs'],
      'no-multi-spaces': 'error',
      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: ['const', 'let', 'var'],
          next: '*',
        },
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var'],
          next: ['const', 'let', 'var'],
        },
      ],
      curly: ['error', 'all'],
      'comma-dangle': ['error', 'always-multiline'],
      'id-length': [
        'error',
        {
          min: 2,
          exceptions: ['i', 'x', 'y', 'e', 'a', 'b'],
        },
      ],
      'id-match': [
        'error',
        '^(([A-Za-z0-9]+){2,})|([A-Z][A-Z_0-9]+)$',
        {
          properties: false,
          onlyDeclarations: true,
        },
      ],
      indent: [
        'error',
        2,
        {
          SwitchCase: 1,
          ignoredNodes: [
            'TemplateLiteral',
            'TemplateLiteral > *',
          ],
        },
      ],
      quotes: ['error', 'single'],
      semi: ['error', 'never'],
    },
  },
]
