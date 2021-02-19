import TestDiscovery from './helper/test-discovery'
import TestCase from './helper/test-case'
import path from 'path'

const testSuite = TestDiscovery.loadAllTests(__dirname + '/languages')

// define tests for all tests in all languages in the test suite
for (const language in testSuite) {
  if (!testSuite.hasOwnProperty(language)) {
    continue
  }

  const testFiles = testSuite[language]
  describe(`Testing language "${language}"`, function () {
    for (const filePath of testFiles) {
      const fileName = path.basename(filePath, path.extname(filePath))

      it(`– should pass test case "${fileName}"`, async () => {
        if (path.extname(filePath) === '.test') {
          await TestCase.runTestCase(language, filePath, false)
        } else {
          await TestCase.runTestsWithHooks(
            language,
            await import(filePath).default,
          )
        }
      })
    }
  })
}
