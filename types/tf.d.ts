import type * as tf from '@tensorflow/tfjs'

declare global {
  interface Window {
    tf: typeof tf
  }
}
