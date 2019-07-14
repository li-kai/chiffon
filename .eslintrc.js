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
