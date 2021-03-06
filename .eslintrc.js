module.exports = {
  root: true,
  extends: ['plugin:prettier/recommended', 'prettier'],
  overrides: [
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
        'prettier',
        'prettier/@typescript-eslint',
      ],
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/ban-types': [
          'error',
          {
            types: { Function: false },
            extendDefaults: true,
          },
        ],
        '@typescript-eslint/explicit-function-return-type': [
          'error',
          {
            allowExpressions: true,
            allowTypedFunctionExpressions: true,
          },
        ],
      },
    },
    {
      files: ['*.js'],
      parser: 'babel-eslint',
      parserOptions: {
        sourceType: 'module',
      },
      extends: ['plugin:prettier/recommended', 'prettier', 'prettier/babel'],
    },
  ],
  env: {
    es6: true,
  },
  rules: {
    'prettier/prettier': 'error',
  },
}
