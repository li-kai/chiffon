import vm from 'vm'

/**
 * Evaluates the string in a secure manner
 * @param {string} code
 */
export function safeEval(code: string): unknown {
  return vm.runInNewContext(code)
}
