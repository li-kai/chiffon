import Prism from './prism-core'

Prism.languages.brainfuck = {
  pointer: {
    pattern: /<|>/,
    alias: 'keyword',
  },
  increment: {
    pattern: /\+/,
    alias: 'inserted',
  },
  decrement: {
    pattern: /-/,
    alias: 'deleted',
  },
  branching: {
    pattern: /\[|\]/,
    alias: 'important',
  },
  operator: /[.,]/,
  comment: /\S+/,
}
