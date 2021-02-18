const fs = require('fs')
const path = require('path')
const components = require('../src/components.js')
const getLoader = require('../src/dependencies')

const languages = Object.keys(components.languages).filter((l) => l != 'meta')

languages.forEach((language) => {
  const ids = getLoader(components, [language], []).getIds()
  ids.pop()
  const pathToLanguage = path.resolve(
    __filename,
    `../../src/components/prism-${language}.js`,
  )

  const content = fs.readFileSync(pathToLanguage, 'utf-8')
  const newContent = `import Prism from './prism-core'\n${ids
    .map((id) => {
      return `import './prism-${id}'`
    })
    .join('\n')}\n${content
    .replace(';(function (Prism) {\n', '')
    .replace('})(Prism)\n', '')}`

  fs.writeFileSync(pathToLanguage, newContent)
})
