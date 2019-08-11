import path from 'path'
import fs from 'fs'
import webpack from 'webpack'
import TestDirectory from './__test-utils__/TestDirectory'

const inputFile = path.resolve(__dirname, '__fixtures__/basic.js')

const globalConfig = {
  mode: 'production',
  entry: { index: inputFile },
  module: {
    rules: [
      {
        test: /\.jsx?/,
        loader: path.resolve(__dirname, '../dist/babel-loader'),
        options: {
          presets: ['@babel/preset-env'],
        },
        exclude: /node_modules/,
      },
    ],
  },
}

describe('babel-loader', () => {
  let testDir: TestDirectory

  beforeEach(() => {
    testDir = new TestDirectory()
  })

  afterEach(async () => {
    await testDir.tearDown()
    // Allow webpack to take some time to close handles
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  it('should transpile files', done => {
    const config = Object.assign({}, globalConfig, {
      entry: { index: inputFile },
      output: {
        path: testDir.path,
      },
    })
    expect.assertions(1)
    webpack(config, () => {
      const outputFilePath = path.resolve(testDir.path, 'index.js')
      const outputFile = fs.readFileSync(outputFilePath, 'utf-8')
      expect(outputFile.includes('.default')).toBeTruthy()
      done()
    })
  })

  it('should not throw errors on successful compilation', done => {
    const config = Object.assign({}, globalConfig, {
      entry: { index: inputFile },
      output: {
        path: testDir.path,
      },
    })
    expect.assertions(3)
    webpack(config, (err, stats) => {
      expect(err).toBeFalsy()
      expect(stats.compilation.errors).toHaveLength(0)
      expect(stats.compilation.warnings).toHaveLength(0)
      done()
    })
  })
})
