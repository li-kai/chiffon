function isBabelRegister(caller) {
  console.log(caller)
  return !!(caller && caller.name === '@babel/register')
}

module.exports = function(api) {
  const isRegister = api.caller(isBabelRegister)

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
