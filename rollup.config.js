import typescript from 'rollup-plugin-typescript2'

export default [
  {
    input: './src/index.ts',
    external: ['crypto', 'uuid', 'ws', '@google-cloud/speech', 'node-fetch'],
    plugins: [
      typescript({
        useTsconfigDeclarationDir: true,
        tsconfigOverride: {
          compilerOptions: {
            declaration: true,
            declarationDir: './dist'
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
      include: ['src/index.ts', 'src/cookies.ts', 'src/server/**']
    }
  },
  {
    input: './src/client.ts',
    plugins: [
      typescript({
        useTsconfigDeclarationDir: true,
        tsconfigOverride: {
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
      file: 'dist/client.js'
    },
    watch: {
      include: ['src/client.ts', 'src/cookies.ts', 'src/client/**']
    }
  }
]
