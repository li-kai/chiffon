import Prism from '../../components/prism-core'
import components from '../../components.json'
import getLoader from '../../dependencies'

/**
 * @typedef PrismLoaderContext
 * @property {import('../../components/prism-core')} Prism The Prism instance.
 * @property {Set<string>} loaded A set of loaded components.
 */

export default {
  /**
   * Creates a new Prism instance with the given language loaded
   *
   * @param {string|string[]} languages
   * @returns {import('../../components/prism-core')}
   */
  async createInstance(languages) {
    jest.resetModules()
    let context = {
      loaded: new Set(),
      Prism: (await import('../../components/prism-core')).default,
    }

    context = await this.loadLanguages(languages, context)

    return context.Prism
  },

  /**
   * Loads the given languages and appends the config to the given Prism object.
   *
   * @private
   * @param {string|string[]} languages
   * @param {PrismLoaderContext} context
   * @returns {PrismLoaderContext}
   */
  async loadLanguages(languages, context) {
    if (typeof languages === 'string') {
      languages = [languages]
    }

    const ids = getLoader(components, languages, [...context.loaded]).getIds()

    await Promise.all([ids.map((id) => import(`../../components/prism-${id}`))])
    ids.forEach((id) => context.loaded.add(id))

    return context
  },

  /**
   * Creates a new empty prism instance
   *
   * @private
   * @returns {Prism}
   */
  createEmptyPrism() {
    jest.resetModules()

    return Prism
  },
}
