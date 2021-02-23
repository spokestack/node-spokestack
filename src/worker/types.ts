import type { GraphModel } from '@tensorflow/tfjs'
import type { SpeechConfig, SpeechEvent } from '../client/types'

export interface SpeechContext {
  config: SpeechConfig
  isActive: boolean
  isSpeech: boolean
  framesProcessed: number
  dispatch: (event: SpeechEvent) => void
  lastEvent?: SpeechEvent
}

/**
 * The interface for individual processors in the speech pipeline.
 * A processor receives the current speech context and a frame of
 * audio and may modify the context, dispatch events, or collect/dispatch
 * the audio itself for further analysis.
 */
export interface SpeechProcessor {
  process(context: SpeechContext, frame: number[]): void
  reset(): void
}

export interface CommandModels {
  filter: GraphModel
  encode: GraphModel
  detect: GraphModel
}
