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

interface ESModule {
  __esModule: boolean
  default?: unknown
}

function isESModule(input: unknown): input is ESModule {
  if (typeof input === 'object' && input != null) {
    const obj = input as { [key: string]: unknown }
    if (obj.__esModule) return true
  }
  return false
}

export function getFunctionFromModule(input: unknown): Function {
  let fn: unknown
  if (isESModule(input) && typeof input.default === 'function') {
    fn = input.default
  }

  if (typeof fn === 'function') {
    return fn
  }
  throw new Error('No function was exported')
}
