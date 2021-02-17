const PrismLoader = require('./helper/prism-loader')
const { BFS, parseRegex } = require('./helper/util')
const { languages } = require('../components.json')
const { visitRegExpAST } = require('regexpp')
const { JS, Words, NFA } = require('refa')
const scslre = require('scslre')

/**
 * A set of all safe (non-exponentially backtracking) RegExp literals (string).
 *
 * @type {Set<string>}
 */
const expoSafeRegexes = new Set()

/**
 * A set of all safe (non-polynomially backtracking) RegExp literals (string).
 *
 * @type {Set<string>}
 */
const polySafeRegexes = new Set()

for (const lang in languages) {
  if (lang === 'meta') {
    continue
  }

  describe(`Patterns of '${lang}'`, function () {
    const Prism = PrismLoader.createInstance(lang)
    testPatterns(Prism)
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
    let name = `Patterns of '${lang}'`
    if (optional.length > 0) {
      name += ` + optional dependencies '${optional.join("', '")}'`
    }
    if (modify.length > 0) {
      name += ` + modify dependencies '${modify.join("', '")}'`
    }

    describe(name, function () {
      const Prism = PrismLoader.createInstance([...optional, ...modify, lang])
      testPatterns(Prism)
    })
  }
}

/**
 * Tests all patterns in the given Prism instance.
 *
 * @param {any} Prism
 *
 * @typedef {import("./helper/util").LiteralAST} LiteralAST
 * @typedef {import("regexpp/ast").CapturingGroup} CapturingGroup
 * @typedef {import("regexpp/ast").Element} Element
 * @typedef {import("regexpp/ast").Group} Group
 * @typedef {import("regexpp/ast").LookaroundAssertion} LookaroundAssertion
 * @typedef {import("regexpp/ast").Pattern} Pattern
 */
function testPatterns(Prism) {
  /**
   * Invokes the given function on every pattern in `Prism.languages`.
   *
   * _Note:_ This will aggregate all errors thrown by the given callback and throw an aggregated error at the end
   * of the iteration. You can also append any number of errors per callback using the `reportError` function.
   *
   * @param {(values: ForEachPatternCallbackValue) => void} callback
   *
   * @typedef ForEachPatternCallbackValue
   * @property {RegExp} pattern
   * @property {LiteralAST} ast
   * @property {string} tokenPath
   * @property {string} name
   * @property {any} parent
   * @property {boolean} lookbehind Whether the first capturing group of the pattern is a Prism lookbehind group.
   * @property {{ key: string, value: any }[]} path
   * @property {(message: string) => void} reportError
   */
  function forEachPattern(callback) {
    const errors = []

    BFS(Prism.languages, (path) => {
      const { key, value } = path[path.length - 1]

      let tokenPath = 'Prism.languages'
      for (const { key } of path) {
        if (!key) {
          // do nothing
        } else if (/^\d+$/.test(key)) {
          tokenPath += `[${key}]`
        } else if (/^[a-z]\w*$/i.test(key)) {
          tokenPath += `.${key}`
        } else {
          tokenPath += `[${JSON.stringify(key)}]`
        }
      }

      if (Object.prototype.toString.call(value) == '[object RegExp]') {
        try {
          let ast
          try {
            ast = parseRegex(value)
          } catch (error) {
            throw new SyntaxError(
              `Invalid RegExp at ${tokenPath}\n\n${error.message}`,
            )
          }

          const parent =
            path.length > 1 ? path[path.length - 2].value : undefined
          callback({
            pattern: value,
            ast,
            tokenPath,
            name: key,
            parent,
            path,
            lookbehind: key === 'pattern' && parent && !!parent.lookbehind,
            reportError: (message) => errors.push(message),
          })
        } catch (error) {
          errors.push(error)
        }
      }
    })

    if (errors.length > 0) {
      throw new Error(errors.map((e) => String(e.message || e)).join('\n\n'))
    }
  }

  /**
   * Invokes the given callback for all capturing groups in the given pattern in left to right order.
   *
   * @param {Pattern} pattern
   * @param {(values: ForEachCapturingGroupCallbackValue) => void} callback
   *
   * @typedef ForEachCapturingGroupCallbackValue
   * @property {CapturingGroup} group
   * @property {number} number Note: Starts at 1.
   */
  function forEachCapturingGroup(pattern, callback) {
    let number = 0
    visitRegExpAST(pattern, {
      onCapturingGroupEnter(node) {
        callback({
          group: node,
          number: ++number,
        })
      },
    })
  }

  /**
   * Returns whether the given element will always have zero width meaning that it doesn't consume characters.
   *
   * @param {Element} element
   * @returns {boolean}
   */
  function isAlwaysZeroWidth(element) {
    switch (element.type) {
      case 'Assertion':
        // assertions == ^, $, \b, lookarounds
        return true
      case 'Quantifier':
        return element.max === 0 || isAlwaysZeroWidth(element.element)
      case 'CapturingGroup':
      case 'Group':
        // every element in every alternative has to be of zero length
        return element.alternatives.every((alt) =>
          alt.elements.every(isAlwaysZeroWidth),
        )
      case 'Backreference':
        // on if the group referred to is of zero length
        return isAlwaysZeroWidth(element.resolved)
      default:
        return false // what's left are characters
    }
  }

  /**
   * Returns whether the given element will always at the start of the whole match.
   *
   * @param {Element} element
   * @returns {boolean}
   */
  function isFirstMatch(element) {
    const parent = element.parent
    switch (parent.type) {
      case 'Alternative':
        // all elements before this element have to of zero length
        if (
          !parent.elements
            .slice(0, parent.elements.indexOf(element))
            .every(isAlwaysZeroWidth)
        ) {
          return false
        }
        const grandParent = parent.parent
        if (grandParent.type === 'Pattern') {
          return true
        } else {
          return isFirstMatch(grandParent)
        }

      case 'Quantifier':
        if (parent.max >= 2) {
          return false
        } else {
          return isFirstMatch(parent)
        }

      default:
        throw new Error(
          `Internal error: The given node should not be a '${element.type}'.`,
        )
    }
  }

  /**
   * Returns whether the given node either is or is a child of what is effectively a Kleene star.
   *
   * @param {import("regexpp/ast").Node} node
   * @returns {boolean}
   */
  function underAStar(node) {
    if (node.type === 'Quantifier' && node.max > 10) {
      return true
    } else if (node.parent) {
      return underAStar(node.parent)
    } else {
      return false
    }
  }

  /**
   * @param {Iterable<T>} iter
   * @returns {T | undefined}
   * @template T
   */
  function firstOf(iter) {
    const [first] = iter
    return first
  }

  it('- should not match the empty string', function () {
    forEachPattern(({ pattern, tokenPath }) => {
      // test for empty string
      expect('').not.toMatch(pattern)
    })
  })

  it('- should have a capturing group if lookbehind is set to true', function () {
    forEachPattern(({ ast, tokenPath, lookbehind }) => {
      if (lookbehind) {
        let hasCapturingGroup = false
        forEachCapturingGroup(ast.pattern, () => {
          hasCapturingGroup = true
        })

        if (!hasCapturingGroup) {
          expect(false).toBe(true)
        }
      }
    })
  })

  it('- should not have lookbehind groups that can be preceded by other some characters', function () {
    forEachPattern(({ ast, tokenPath, lookbehind }) => {
      if (!lookbehind) {
        return
      }
      forEachCapturingGroup(ast.pattern, ({ group, number }) => {
        if (number === 1 && !isFirstMatch(group)) {
          expect(false).toBe(true)
        }
      })
    })
  })

  it('- should not have lookbehind groups that only have zero-width alternatives', function () {
    forEachPattern(({ ast, tokenPath, lookbehind, reportError }) => {
      if (!lookbehind) {
        return
      }
      forEachCapturingGroup(ast.pattern, ({ group, number }) => {
        if (number === 1 && isAlwaysZeroWidth(group)) {
          const groupContent = group.raw.substr(1, group.raw.length - 2)
          const replacement =
            group.alternatives.length === 1
              ? groupContent
              : `(?:${groupContent})`
          reportError(
            `${tokenPath}: The lookbehind group ${group.raw} does not consume characters.\n\n` +
              `Therefor it is not necessary to use a lookbehind group.\n` +
              `To fix this, replace the lookbehind group with ${replacement} and remove the 'lookbehind' property.`,
          )
        }
      })
    })
  })

  it('- should not have unused capturing groups', function () {
    forEachPattern(({ ast, tokenPath, lookbehind, reportError }) => {
      forEachCapturingGroup(ast.pattern, ({ group, number }) => {
        const isLookbehindGroup = lookbehind && number === 1
        if (group.references.length === 0 && !isLookbehindGroup) {
          const fixes = []
          fixes.push(
            `Make this group a non-capturing group ('(?:...)' instead of '(...)'). (It's usually this option.)`,
          )
          fixes.push(
            `Reference this group with a backreference (use '\\${number}' for this).`,
          )
          if (number === 1 && !lookbehind) {
            if (isFirstMatch(group)) {
              fixes.push(`Add a 'lookbehind: true' declaration.`)
            } else {
              fixes.push(
                `Add a 'lookbehind: true' declaration. (This group is not a valid lookbehind group because it can be preceded by some characters.)`,
              )
            }
          }

          reportError(
            `${tokenPath}: Unused capturing group ${group.raw}.\n\n` +
              `Unused capturing groups generally degrade the performance of regular expressions. ` +
              `They might also be a sign that a backreference is incorrect or that a 'lookbehind: true' declaration in missing.\n` +
              `To fix this, do one of the following:\n` +
              fixes.map((f) => '- ' + f).join('\n'),
          )
        }
      })
    })
  })

  it('- should have nice names and aliases', function () {
    const niceName = /^[a-z][a-z\d]*(?:-[a-z\d]+)*$/
    function testName(name, desc = 'token name') {
      if (!niceName.test(name)) {
        expect(false).toBe(true)
      }
    }

    forEachPattern(({ name, parent, tokenPath, path }) => {
      // token name
      let offset = 1
      if (name == 'pattern') {
        // regex can be inside an object
        offset++
      }
      if (Array.isArray(path[path.length - 1 - offset].value)) {
        // regex/regex object can be inside an array
        offset++
      }
      const patternName = path[path.length - offset].key
      testName(patternName)

      // check alias
      if (name == 'pattern' && 'alias' in parent) {
        const alias = parent.alias
        if (typeof alias === 'string') {
          testName(alias, `alias of '${tokenPath}'`)
        } else if (Array.isArray(alias)) {
          alias.forEach((name) => testName(name, `alias of '${tokenPath}'`))
        }
      }
    })
  })

  it('- should not use octal escapes', function () {
    forEachPattern(({ ast, tokenPath, reportError }) => {
      visitRegExpAST(ast.pattern, {
        onCharacterEnter(node) {
          if (/^\\(?:[1-9]|\d{2,})$/.test(node.raw)) {
            reportError(
              `${tokenPath}: Octal escape ${node.raw}.\n\n` +
                `Octal escapes can be confused with backreferences, so please do not use them.\n` +
                `To fix this, use a different escape method. ` +
                `Note that this could also be an invalid backreference, so be sure to carefully analyse the pattern.`,
            )
          }
        },
      })
    })
  })

  it('- should not cause exponential backtracking', function () {
    forEachPattern(({ pattern, ast, tokenPath }) => {
      const patternStr = String(pattern)
      if (expoSafeRegexes.has(patternStr)) {
        // we know that the pattern won't cause exp backtracking because we checked before
        return
      }

      const parser = JS.Parser.fromAst(ast)
      /**
       * Parses the given element and creates its NFA.
       *
       * @param {import("refa").JS.ParsableElement} element
       * @returns {NFA}
       */
      function toNFA(element) {
        const { expression, maxCharacter } = parser.parseElement(element, {
          backreferences: 'resolve',
          lookarounds: 'disable',
        })
        return NFA.fromRegex(expression, { maxCharacter })
      }

      /**
       * Checks whether the alternatives of the given node are disjoint. If the alternatives are not disjoint
       * and the give node is a descendant of an effective Kleene star, then an error will be thrown.
       *
       * @param {CapturingGroup | Group | LookaroundAssertion} node
       * @returns {void}
       */
      function checkDisjointAlternatives(node) {
        if (!underAStar(node) || node.alternatives.length < 2) {
          return
        }

        const alternatives = node.alternatives

        const total = toNFA(alternatives[0])
        total.withoutEmptyWord()
        for (let i = 1, l = alternatives.length; i < l; i++) {
          const a = alternatives[i]
          const current = toNFA(a)
          current.withoutEmptyWord()

          if (!total.isDisjointWith(current)) {
            expect(false).toBe(true)
          } else if (i !== l - 1) {
            total.union(current)
          }
        }
      }

      visitRegExpAST(ast.pattern, {
        onCapturingGroupLeave: checkDisjointAlternatives,
        onGroupLeave: checkDisjointAlternatives,
        onAssertionLeave(node) {
          if (node.kind === 'lookahead' || node.kind === 'lookbehind') {
            checkDisjointAlternatives(node)
          }
        },

        onQuantifierLeave(node) {
          if (node.max < 10) {
            return // not a star
          }
          if (
            node.element.type !== 'CapturingGroup' &&
            node.element.type !== 'Group'
          ) {
            return // not a group
          }

          // The idea here is the following:
          //
          // We have found a part `A*` of the regex (`A` is assumed to not accept the empty word). Let `I` be
          // the intersection of `A` and `A{2,}`. If `I` is not empty, then there exists a non-empty word `w`
          // that is accepted by both `A` and `A{2,}`. That means that there exists some `m>1` for which `w`
          // is accepted by `A{m}`.
          // This means that there are at least two ways `A*` can accept `w`. It can be accepted as `A` or as
          // `A{m}`. Hence there are at least 2^n ways for `A*` to accept the word `w{n}`. This is the main
          // requirement for exponential backtracking.
          //
          // This is actually only a crude approximation for the real analysis that would have to be done. We
          // would actually have to check the intersection `A{p}` and `A{p+1,}` for all p>0. However, in most
          // cases, the approximation is good enough.

          const nfa = toNFA(node.element)
          nfa.withoutEmptyWord()
          const twoStar = nfa.copy()
          twoStar.quantify(2, Infinity)

          if (!nfa.isDisjointWith(twoStar)) {
            const word = Words.pickMostReadableWord(
              firstOf(nfa.intersectionWordSets(twoStar)),
            )
            const example = Words.fromUnicodeToString(word)
            expect(false).toBe(true)
          }
        },
      })

      expoSafeRegexes.add(patternStr)
    })
  })

  it('- should not cause polynomial backtracking', function () {
    forEachPattern(({ pattern, ast, tokenPath }) => {
      const patternStr = String(pattern)
      if (polySafeRegexes.has(patternStr)) {
        // we know that the pattern won't cause poly backtracking because we checked before
        return
      }

      const result = scslre.analyse(ast, {
        maxReports: 1,
        reportTypes: { Move: false },
      })
      if (result.reports.length > 0) {
        const report = result.reports[0]

        let rangeOffset
        let rangeStr
        let rangeHighlight

        switch (report.type) {
          case 'Trade': {
            const start = Math.min(
              report.startQuant.start,
              report.endQuant.start,
            )
            const end = Math.max(report.startQuant.end, report.endQuant.end)
            rangeOffset = start + 1
            rangeStr = patternStr.substring(start + 1, end + 1)
            rangeHighlight = highlight(
              [
                { ...report.startQuant, label: 'start' },
                { ...report.endQuant, label: 'end' },
              ],
              -start,
            )
            break
          }
          case 'Self': {
            rangeOffset = report.parentQuant.start + 1
            rangeStr = patternStr.substring(
              report.parentQuant.start + 1,
              report.parentQuant.end + 1,
            )
            rangeHighlight = highlight(
              [{ ...report.quant, label: 'self' }],
              -report.parentQuant.start,
            )
            break
          }
          case 'Move': {
            rangeOffset = 1
            rangeStr = patternStr.substring(1, report.quant.end + 1)
            rangeHighlight = highlight([report.quant])
            break
          }
          default:
            throw new Error(
              'Invalid report type "' +
                report.type +
                '". This should never happen.',
            )
        }

        const attackChar = `/${report.character.literal.source}/${report.character.literal.flags}`
        const fixed = report.fix()

        expect(false).toBe(true)
      }

      polySafeRegexes.add(patternStr)
    })
  })
}

/**
 * @param {Highlight[]} highlights
 * @param {number} [offset]
 * @returns {string}
 *
 * @typedef Highlight
 * @property {number} start
 * @property {number} end
 */
function highlight(highlights, offset = 0) {
  highlights.sort((a, b) => a.start - b.start)

  const lines = []
  while (highlights.length > 0) {
    const newHighlights = []
    let l = ''
    for (const highlight of highlights) {
      const start = highlight.start + offset
      const end = highlight.end + offset
      if (start < l.length) {
        newHighlights.push(highlight)
      } else {
        l += ' '.repeat(start - l.length)
        l += '^'
        l += '~'.repeat(end - start - 1)
        if (highlight.label) {
          l += '[' + highlight.label + ']'
        }
      }
    }
    lines.push(l)
    highlights = newHighlights
  }

  return lines.join('\n')
}

/**
 * @param {string} str
 * @param {string} amount
 * @returns {string}
 */
function indent(str, amount = '    ') {
  return str
    .split(/\r?\n/g)
    .map((m) => (m === '' ? '' : amount + m))
    .join('\n')
}
