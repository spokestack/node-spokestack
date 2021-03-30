import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'

const extensions = ['.js', '.ts']

const server = {
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
}

const client = {
  input: './src/client.ts',
  plugins: [
    commonjs(),
    nodeResolve({
      browser: true,
      extensions
    }),
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
* Custom tools for recording audio and processing voice on the client
* Copyright Spokestack
* https://github.com/spokestack/node-spokestack/blob/master/MIT-License.txt
*/`,
    format: 'cjs',
    file: 'dist/client.js'
  },
  watch: {
    include: ['src/client.ts', 'src/cookies.ts', 'src/client/**']
  }
}

const worker = {
  input: './src/worker/index.ts',
  plugins: [
    alias({
      entries: {
        '@tensorflow/tfjs': './custom_tfjs/custom_tfjs.js'
      }
    }),
    typescript({
      tsconfig: 'src/worker/tsconfig.json'
    }),
    commonjs(),
    nodeResolve({
      browser: true
    })
  ],
  output: {
    format: 'iife',
    file: 'dist/spokestack-web-worker.js'
  },
  watch: {
    include: ['src/worker/**']
  }
}

export default [server, client, worker]
