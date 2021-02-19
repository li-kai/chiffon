import path from 'path'
import fs from 'fs'
import webpack from 'webpack'
import TestDirectory from './__test-utils__/TestDirectory'
import BabelWebpackPlugin from './BabelWebpackPlugin'

const fixturesPath = path.resolve(__dirname, '__fixtures__')
const inputFile = path.join(fixturesPath, 'basic.js')

const globalConfig = {
  mode: 'production',
  entry: { index: inputFile },
  module: {
    rules: [
      {
        test: /\.jsx?/,
        loader: path.resolve(__dirname, '../dist/babel-loader'),
        options: {
          root: fixturesPath,
        },
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new BabelWebpackPlugin({
      targets: [
        {
          target: 'client-legacy',
        },
        {
          target: 'client-modern',
          filename: '[name].mjs',
          chunkFilename: '[name].mjs',
        },
      ],
    }),
  ],
}

describe('BabelWebpackPlugin', () => {
  let testDir: TestDirectory

  beforeEach(() => {
    testDir = new TestDirectory()
  })

  afterEach(async () => {
    await testDir.tearDown()
    // Allow webpack to take some time to close handles
    await new Promise((resolve) => setTimeout(resolve, 100))
  })

  it('should transpile files', (done) => {
    const config = Object.assign({}, globalConfig, {
      entry: { index: inputFile },
      output: {
        path: testDir.path,
      },
    })
    expect.assertions(2)
    webpack(config, () => {
      const outputCommonJSPath = path.resolve(testDir.path, 'index.js')
      const outputCommonJS = fs.readFileSync(outputCommonJSPath, 'utf-8')
      expect(outputCommonJS.includes('.default')).toBeTruthy()

      const outputMJSPath = path.resolve(testDir.path, 'index.mjs')
      const outputMJS = fs.readFileSync(outputMJSPath, 'utf-8')
      expect(outputMJS.includes('=>')).toBeTruthy()
      done()
    })
  })

  it('should not throw errors on successful compilation', (done) => {
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
