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

const tfjs = {
  input: './custom_tfjs/custom_tfjs.js',
  plugins: [
    commonjs(),
    nodeResolve({
      browser: true
    })
  ],
  output: {
    compact: true,
    format: 'iife',
    name: 'tf',
    file: 'dist/tensorflow.js'
  },
  watch: {
    include: ['custom_tfjs/**']
  }
}

const worker = {
  input: './src/worker/index.ts',
  plugins: [
    typescript({
      tsconfig: 'src/worker/tsconfig.json'
    })
  ],
  output: {
    format: 'iife',
    file: 'dist/web-worker.js'
  },
  watch: {
    include: ['src/worker/**']
  }
}

export default [server, client, tfjs, worker]
