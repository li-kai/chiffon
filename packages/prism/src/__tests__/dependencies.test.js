const getLoader = require('../dependencies')
const components = require('../components.json')

describe('Dependency logic', function () {
  /** @type {import("../dependencies").Components} */
  const components = {
    languages: {
      a: {
        alias: 'a2',
      },
      b: {
        alias: 'b2',
      },
      c: {
        require: 'a',
        optional: ['b', 'e'],
      },
      d: {
        require: ['c', 'b'],
        alias: 'xyz',
      },
    },
    pluginsOrSomething: {
      e: {
        modify: 'a',
      },
    },
  }

  /**
   * Returns the ids of `getLoader`.
   *
   * @param {string[]} load
   * @param {string[]} [loaded]
   * @returns {string[]}
   */
  function getIds(load, loaded) {
    return getLoader(components, load, loaded).getIds()
  }

  describe('Returned ids', function () {
    it('- should load requirements correctly', () => {
      // should load requirements
      expect(getIds(['d'])).toEqual(['a', 'b', 'c', 'd'])

      // should not load already loaded requirements if not necessary
      expect(getIds(['d'], ['a', 'b'])).toEqual(['c', 'd'])

      // should load already loaded requirements if requested
      expect(getIds(['a', 'd'], ['a', 'b'])).toEqual(['a', 'c', 'd'])

      // should reload modified components
      // can't really test this due to jest's internal module cache
      // expect(getIds(['e'], ['a', 'b', 'c', 'd'])).toEqual(['a', 'c', 'd', 'e'])

      // should work with empty load
      expect(getIds([], ['a', 'b', 'c', 'd'])).toEqual([])

      // should return unknown ids as is
      expect(getIds(['c', 'foo'], ['bar'])).toEqual(['a', 'c', 'foo'])

      // should throw on unknown dependencies
      expect(() => {
        /** @type {import("../dependencies").Components} */
        const circular = {
          languages: {
            a: {
              require: 'c',
            },
            b: 'B',
          },
        }
        getLoader(circular, ['a']).getIds()
      }).toThrow()
    })
  })

  describe('Load order', function () {
    // Note: The order of a and b isn't defined, so don't add any test with both of them being loaded here

    it('- should load components correctly', () => {
      // should load components in the correct order (require)
      expect(getIds(['c'])).toEqual(['a', 'c'])

      // should load components in the correct order (modify)
      expect(getIds(['e', 'a'])).toEqual(['a', 'e'])

      // should load components in the correct order (optional)
      expect(getIds(['c', 'b'], ['a'])).toEqual(['b', 'c'])

      // should load components in the correct order (require + optional)
      expect(getIds(['d'], ['a'])).toEqual(['b', 'c', 'd'])

      // should load components in the correct order (require + modify + optional)
      expect(getIds(['d', 'e'], ['b'])).toEqual(['a', 'e', 'c', 'd'])
    })
  })

  describe('Aliases', function () {
    it('- should resolve aliases in the list of components to load', function () {
      expect(getIds(['xyz'])).toEqual(['a', 'b', 'c', 'd'])
    })

    it('- should resolve aliases in the list of loaded components', function () {
      expect(getIds(['d'], ['a', 'a2', 'b2'])).toEqual(['c', 'd'])
    })

    it('- should throw on duplicate aliases', function () {
      expect(() => {
        /** @type {import("../dependencies").Components} */
        const circular = {
          languages: {
            a: {
              alias: 'c',
            },
            b: {
              alias: 'c',
            },
          },
        }
        getLoader(circular, [
          'a',
          'foo' /* force the lazy alias resolver */,
        ]).getIds()
      }).toThrow()
    })

    it('- should throw on aliases which are components', function () {
      expect(() => {
        /** @type {import("../dependencies").Components} */
        const circular = {
          languages: {
            a: {
              alias: 'b',
            },
            b: 'B',
          },
        }
        getLoader(circular, [
          'a',
          'foo' /* force the lazy alias resolver */,
        ]).getIds()
      }).toThrow()
    })
  })

  describe('Circular dependencies', function () {
    it('- should throw on circular dependencies', function () {
      expect(() => {
        /** @type {import("../dependencies").Components} */
        const circular = {
          languages: {
            a: {
              require: 'b',
            },
            b: {
              optional: 'a',
            },
          },
        }
        getLoader(circular, ['a']).getIds()
      }).toThrow()
    })
  })

  describe('Async loading', function () {
    it('- should load components in the correct order', async function () {
      /** @type {import("../dependencies").Components} */
      const localComponents = {
        languages: {
          a: {},
          b: {
            require: 'a',
          },
          c: {
            require: 'b',
          },
        },
      }

      /** @type {string[]} */
      const actualLoadOrder = []
      /** @type {string[]} */
      const actualResolveOrder = []

      /**
       *
       * @param {string} id
       * @returns {Promise<void>}
       */
      function loadComp(id) {
        actualLoadOrder.push(id)

        // the idea is that the components which have to be loaded first, take the longest, so if all were to
        // start getting loaded at the same time, their order would be the reverse of the expected order.
        let delay
        if (id === 'a') {
          delay = 30
        } else if (id === 'b') {
          delay = 20
        } else if (id === 'c') {
          delay = 10
        }

        return new Promise((resolve) => {
          setTimeout(() => {
            actualResolveOrder.push(id)
            resolve()
          }, delay)
        })
      }

      const loader = getLoader(localComponents, ['c'])

      await loader.load((id) => loadComp(id), {
        series: async (before, after) => {
          await before
          await after()
        },
        parallel: async (values) => {
          await Promise.all(values)
        },
      })

      expect(actualLoadOrder).toEqual(['a', 'b', 'c'])
      expect(actualResolveOrder).toEqual(['a', 'b', 'c'])
    })
  })
})

describe('components.json', function () {
  it('- should be valid', function () {
    try {
      const allIds = []
      for (const category in components) {
        Object.keys(components[category]).forEach((id) => allIds.push(id))
      }
      // and an alias, so we force the lazy alias resolver to check all aliases
      allIds.push('js')

      getLoader(components, allIds).getIds()
    } catch (error) {
      expect(false).toBe(true)
    }
  })

  it('- should not have redundant optional dependencies', function () {
    /** @type {Object<string, import("../dependencies").ComponentEntry>} */
    const entries = {}

    for (const category in components) {
      for (const id in components[category]) {
        const entry = components[category][id]
        if (id !== 'meta' && entry && typeof entry === 'object') {
          entries[id] = entry
        }
      }
    }

    function toArray(value) {
      if (Array.isArray(value)) {
        return value
      } else if (value == undefined) {
        return []
      } else {
        return [value]
      }
    }

    for (const id in entries) {
      const entry = entries[id]
      const optional = new Set(toArray(entry.optional))

      for (const modifyId of toArray(entry.modify)) {
        if (optional.has(modifyId)) {
          expect(false).toBe(true)
        }
      }
      for (const requireId of toArray(entry.require)) {
        if (optional.has(requireId)) {
          expect(false).toBe(true)
        }
      }
    }
  })

  it('- should have a sorted language list', function () {
    const ignore = new Set(['meta', 'markup', 'css', 'clike', 'javascript'])
    /** @type {{ id: string, title: string }[]} */
    const languages = Object.keys(components.languages)
      .filter((key) => !ignore.has(key))
      .map((key) => {
        return {
          id: key,
          title: components.languages[key].title,
        }
      })

    /**
     * Transforms the given title into an intermediate representation to allowed for sensible comparisons
     * between titles.
     *
     * @param {string} title
     */
    function transformTitle(title) {
      return title.replace(/\W+/g, '').replace(/^\d+/, '').toLowerCase()
    }

    const sorted = [...languages].sort((a, b) => {
      const comp = transformTitle(a.title).localeCompare(
        transformTitle(b.title),
      )
      if (comp !== 0) {
        return comp
      }
      // a and b have the same intermediate form (e.g. "C" => "C", "C++" => "C", "C#" => "C").
      return a.title.toLowerCase().localeCompare(b.title.toLowerCase())
    })

    expect(languages).toMatchObject(sorted)
  })
})
