import typescript from 'rollup-plugin-typescript2'
import path from 'path'

const declarationDir = path.join(__dirname, 'types')
console.log(`Writing type declaration files to ${declarationDir}`)

export default {
  input: './src/index.ts',
  external: ['crypto', 'uuid', 'ws', '@google-cloud/speech'],
  plugins: [
    typescript({
      tsconfigOverride: {
        exclude: ['node_modules'],
        compilerOptions: {
          declaration: true
        }
      }
    })
  ],
  output: {
    banner: `/**
 * Custom tools for easy integration with the Spokestack API
 * Copyright Spokestack
 * https://github.com/spokestack/node-spokestack/blob/master/MIT-License.txt
 */`,
    format: 'cjs',
    name: 'Spokestack',
    file: 'dist/index.js'
  },
  watch: {
    include: 'src/**'
  }
}
