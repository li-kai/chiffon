import TokenStreamTransformer from './helper/token-stream-transformer'
import TestCase from './helper/test-case'

describe('The token stream transformer', function () {
  it('should handle all kinds of simple transformations', function () {
    const tokens = [{ type: 'type', content: 'content' }, 'string']

    const expected = [['type', 'content'], 'string']

    expect(TokenStreamTransformer.simplify(tokens)).toEqual(expected)
  })

  it('should handle nested structures', function () {
    const tokens = [
      {
        type: 'type',
        content: [
          {
            type: 'insideType',
            content: [{ type: 'insideInsideType', content: 'content' }],
          },
        ],
      },
    ]

    const expected = [
      ['type', [['insideType', [['insideInsideType', 'content']]]]],
    ]

    expect(TokenStreamTransformer.simplify(tokens)).toEqual(expected)
  })

  it('should strip empty tokens', function () {
    const tokenStream = ['', '\r\n', '\t', ' ']

    const expectedSimplified = []

    expect(TokenStreamTransformer.simplify(tokenStream)).toEqual(
      expectedSimplified,
    )
  })

  it('should strip empty token tree branches', function () {
    const tokenStream = [
      {
        type: 'type',
        content: ['', { type: 'nested', content: [''] }, ''],
      },
      '',
    ]

    const expectedSimplified = [['type', [['nested', []]]]]

    expect(TokenStreamTransformer.simplify(tokenStream)).toEqual(
      expectedSimplified,
    )
  })

  it('should ignore all properties in tokens except value and content', function () {
    const tokenStream = [{ type: 'type', content: 'content', alias: 'alias' }]

    const expectedSimplified = [['type', 'content']]

    expect(TokenStreamTransformer.simplify(tokenStream)).toEqual(
      expectedSimplified,
    )
  })
})

describe('The language name parsing', function () {
  it('should use the last language as the main language if no language is specified', function () {
    expect(TestCase.parseLanguageNames('a')).toEqual({
      languages: ['a'],
      mainLanguage: 'a',
    })

    expect(TestCase.parseLanguageNames('a+b+c')).toEqual({
      languages: ['a', 'b', 'c'],
      mainLanguage: 'c',
    })
  })

  it('should use the specified language as main language', function () {
    expect(TestCase.parseLanguageNames('a+b!+c')).toEqual({
      languages: ['a', 'b', 'c'],
      mainLanguage: 'b',
    })
  })

  it('should throw an error if there are multiple main languages', function () {
    expect(() => {
      TestCase.parseLanguageNames('a+b!+c!')
    }).toThrow('There are multiple main languages defined.')
  })
})
