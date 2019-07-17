function getTarget(caller) {
  return caller && caller.target
}

module.exports = function(api) {
  const nodeEnv = process.env.NODE_ENV
  const target = api.caller(getTarget)
  api.cache.using(() => `${target}-${nodeEnv}`)

  const presetEnvConfig = {
    modules: 'commonjs',
  }
  if (target === 'server' || target === 'node') {
    presetEnvConfig.targets = { node: 'current' }
  } else if (target === 'client-modern') {
    presetEnvConfig.targets = { esmodules: true }
    presetEnvConfig.modules = false
  }

  return {
    presets: [['@babel/preset-env', presetEnvConfig]],
    plugins: [
      ['@babel/plugin-transform-react-jsx', { pragma: 'h' }],
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-syntax-dynamic-import',
    ],
  }
}
