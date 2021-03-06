import PrismLoader from './helper/prism-loader'
import { languages } from '../components.json'

function toArray(value) {
  if (Array.isArray(value)) {
    return value
  } else if (value === undefined) {
    return []
  }
  return [value]
}

// the keys of Prism.languages without any loaded languages (basically just a few functions)
const ignoreKeys = Object.keys(PrismLoader.createEmptyPrism().languages)

for (const lang in languages) {
  if (lang === 'meta') {
    continue
  }

  describe(`Testing language aliases of '${lang}'`, function () {
    if (languages[lang].aliasTitles) {
      it('- should have all alias titles registered as alias', function () {
        var aliases = new Set(toArray(languages[lang].alias))

        Object.keys(languages[lang].aliasTitles).forEach((id) => {
          if (!aliases.has(id)) {
            const titleJson = JSON.stringify(languages[lang].aliasTitles[id])
            expect(false).toBe(true)
          }
        })
      })
    }

    it('- should known all aliases', async () => {
      var prism = await PrismLoader.createInstance(lang)
      var loadedLanguages = new Set(Object.keys(prism.languages))

      // check that all aliases are defined
      toArray(languages[lang].alias).forEach((alias) => {
        expect(loadedLanguages.has(alias)).toBe(true)
      })

      // remove ignore keys
      ignoreKeys.forEach((x) => loadedLanguages.delete(x))

      // remove language, aliases, and requirements
      function remove(lang) {
        loadedLanguages.delete(lang)
        toArray(languages[lang].alias).forEach((alias) =>
          loadedLanguages.delete(alias),
        )

        // remove recursively
        toArray(languages[lang].require).forEach((id) => remove(id))
      }
      remove(lang)

      // there should be nothing left
      if (loadedLanguages.size > 0) {
        const unregisteredAliases = `(${
          loadedLanguages.size
        }) ${JSON.stringify([...loadedLanguages])}`
        expect(false).toBe(true)
      }
    })
  })
}
