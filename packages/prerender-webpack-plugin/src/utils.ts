import vm from 'vm'

const vmContext = vm.createContext({
  __filename: __filename,
  __dirname: __dirname,
  exports: exports,
  require: require,
  module: module,
})

// TODO: make a simple fixed size cache
const cache = new Map<string, unknown>()

/**
 * Evaluates the string in a secure manner
 * @param {string} code
 */
export function safeEval(filename: string, code: string): unknown {
  const cacheKey = `${filename}${code}`
  let result = cache.get(cacheKey)

  if (!result) {
    const vmScript = new vm.Script(code, { filename })
    result = vmScript.runInNewContext(vmContext)
    cache.clear()
    cache.set(cacheKey, result)
  }

  return result
}
