module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: 'commonjs',
      },
    ],
  ],
  plugins: [
    ['@babel/plugin-transform-react-jsx', { pragma: 'h' }],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-syntax-dynamic-import',
  ],
}
