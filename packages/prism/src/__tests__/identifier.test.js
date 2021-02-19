import PrismLoader from './helper/prism-loader'
import { languages } from '../components.json'
import TokenStreamTransformer from './helper/token-stream-transformer'

// This is where you can exclude a language from the identifier test.
//
// To exclude a language to the `testOptions` variable and add your language and the identifier types it should
// excluded from. All languages opt-in for all identifier types by default, so you have to explicitly disable each type
// you want to disable by setting it to `false`.
// Also add a small comment explaining why the language was excluded.
//
// The actual identifiers for all identifier types are defined in the `identifiers` variable.

/**
 * @type {Partial<Record<keyof import("../components.json")["languages"], IdentifierTestOptions>>}
 *
 * @typedef IdentifierTestOptions
 * @property {boolean} [word=true]
 * @property {boolean} [number=true]
 * @property {boolean} [template=true]
 */
const testOptions = {
  // all of these have a special syntax for tokens of the form __something__
  asciidoc: {
    template: false,
  },
  markdown: {
    template: false,
  },
  textile: {
    template: false,
  },

  // LilyPond doesn't tokenize based on words
  lilypond: {
    word: false,
    number: false,
    template: false,
  },
}

/** @type {Record<keyof IdentifierTestOptions, string[]>} */
const identifiers = {
  word: [
    'abc',
    'word',
    'foo1',
    'foo123',
    'foo123bar',
    'foo_123',
    'foo_123_bar',
  ],
  number: ['0', '1', '9', '123', '123456789'],
  template: [
    '__PHP0__',
    '__LANG0__',
    '__LANG123__',
    '___PLACEHOLDER_0___',
    '___PLACEHOLDER_123___',
  ],
}

// Below is the implementation of the test.
// If you only came here to exclude a language, you won't find anything below.

/** @type {Record<string, string>} */
const aliasMap = {}
for (const name in languages) {
  const element = languages[name]
  if (element.alias) {
    if (Array.isArray(element.alias)) {
      element.alias.forEach((a) => {
        aliasMap[a] = name
      })
    } else {
      aliasMap[element.alias] = name
    }
  }
}

for (const lang in languages) {
  if (lang === 'meta') {
    continue
  }

  describe(`Test '${lang}'`, function () {
    const loadPrism = () => PrismLoader.createInstance(lang)
    testLiterals(loadPrism, lang)
  })

  function toArray(value) {
    if (Array.isArray(value)) {
      return value
    } else if (value != null) {
      return [value]
    } else {
      return []
    }
  }

  let optional = toArray(languages[lang].optional)
  let modify = toArray(languages[lang].modify)

  if (optional.length > 0 || modify.length > 0) {
    let name = `Test '${lang}'`
    if (optional.length > 0) {
      name += ` + optional dependencies '${optional.join("', '")}'`
    }
    if (modify.length > 0) {
      name += ` + modify dependencies '${modify.join("', '")}'`
    }

    describe(name, function () {
      const loadPrism = () =>
        PrismLoader.createInstance([...optional, ...modify, lang])
      testLiterals(loadPrism, lang)
    })
  }
}

/**
 * @param {string} lang
 * @returns {IdentifierTestOptions}
 */
function getOptions(lang) {
  return testOptions[aliasMap[lang] || lang] || {}
}

/**
 * @param {string | Token | (string | Token)[]} token
 * @returns {boolean}
 *
 * @typedef Token
 * @property {string} type
 * @property {string | Token | (string | Token)[]} content
 */
function isNotBroken(token) {
  if (typeof token === 'string') {
    return true
  } else if (Array.isArray(token)) {
    return token.length === 1 && isNotBroken(token[0])
  } else {
    return isNotBroken(token.content)
  }
}

/**
 * Tests all patterns in the given Prism instance.
 *
 * @param {any} loadPrism
 * @param {lang} Prism
 */
function testLiterals(loadPrism, lang) {
  /**
   * @param {Prism} prism
   * @param {string[]} identifierElements
   * @param {keyof IdentifierTestOptions} identifierType
   */
  function matchNotBroken(Prism, identifierElements, identifierType) {
    for (const name in Prism.languages) {
      const grammar = Prism.languages[name]
      if (typeof grammar !== 'object') {
        continue
      }

      const options = getOptions(name)
      if (options[identifierType] === false) {
        continue
      }

      for (const ident of identifierElements) {
        const tokens = Prism.tokenize(ident, grammar)

        if (!isNotBroken(tokens)) {
          expect(false).toBe(true)
        }
      }
    }
  }

  const options = getOptions(lang)
  for (const key in identifiers) {
    const identifierType = /** @type {keyof IdentifierTestOptions} */ (key)
    const element = identifiers[identifierType]
    if (options[identifierType] !== false) {
      it(`- should not break ${identifierType} identifiers`, async () => {
        const Prism = await loadPrism()
        matchNotBroken(Prism, element, identifierType)
      })
    }
  }
}
