function getTarget(caller) {
  return caller && caller.target
}

module.exports = function(api) {
  const nodeEnv = process.env.NODE_ENV
  api.cache.using(() => ['production', 'development'].indexOf(nodeEnv))
  // using api.caller automatically adds it to the cache
  const target = api.caller(getTarget)

  // Assume by default we are running in node
  const presetEnvConfig = { modules: 'commonjs', targets: { node: 'current' } }

  // config changes only when web targets are specified
  if (target === 'client-legacy') {
    presetEnvConfig.targets = {}
  } else if (target === 'client-modern') {
    presetEnvConfig.targets = { esmodules: true }
    presetEnvConfig.modules = false
  }

  return {
    presets: [['@babel/preset-env', presetEnvConfig]],
    plugins: [
      '@babel/plugin-transform-react-jsx',
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-syntax-dynamic-import',
    ],
  }
}
