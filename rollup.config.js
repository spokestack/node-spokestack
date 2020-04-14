import typescript from 'rollup-plugin-typescript2'

export default [
  {
    input: './src/index.ts',
    external: ['crypto', 'uuid', 'ws', '@google-cloud/speech', 'node-fetch'],
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
      file: 'index.js'
    },
    watch: {
      include: ['src/server/**', 'src/utils/**']
    }
  },
  {
    input: './src/client.ts',
    plugins: [
      typescript({
        tsconfigOverride: {
          exclude: ['node_modules'],
          compilerOptions: {
            declaration: false
          }
        }
      })
    ],
    output: {
      banner: `/**
 * Custom tools for recording audio and processing voice on the client
 * Copyright Spokestack
 * https://github.com/spokestack/node-spokestack/blob/master/MIT-License.txt
 */`,
      format: 'cjs',
      name: 'Spokestack',
      file: 'client.js'
    },
    watch: {
      include: ['src/client/**', 'src/utils/**']
    }
  }
]
