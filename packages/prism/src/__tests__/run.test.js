// @ts-check
const TestDiscovery = require('./helper/test-discovery')
const TestCase = require('./helper/test-case')
const path = require('path')

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

      it(`– should pass test case "${fileName}"`, function () {
        if (path.extname(filePath) === '.test') {
          TestCase.runTestCase(language, filePath, false)
        } else {
          TestCase.runTestsWithHooks(language, require(filePath))
        }
      })
    }
  })
}
