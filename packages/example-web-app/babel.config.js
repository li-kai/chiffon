module.exports = function(api) {
  const nodeEnv = process.env.NODE_ENV
  const babelEnv = process.env.BABEL_ENV
  const env = nodeEnv || babelEnv
  const target = process.env.TARGET
  api.cache.using(() => `${target}~${env}`)

  return {
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
}
