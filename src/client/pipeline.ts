import { SpeechConfig, Stage } from './types'
import SpeechPipeline, { PipelineEventHandler, SpeechPipelineConfig } from './SpeechPipeline'

/**
 * Preset profiles for use with startPipeline that include both
 * default configuration and lists of processing stages. Individual
 * stages may require additional configuration that cannot be provided
 * automatically, so see each stage for more details. The stages used
 * by each profile are as follows:
 *
 * - **Keyword**: VadTrigger and KeywordRecognizer:
 *   actively listens for any user speech and delivers a transcript if
 *   a keyword is recognized.
 * - **Wakeword**: WakewordTrigger:
 *   listens passively until a wakeword is recognized, then activates the
 *   pipeline so that ASR can be performed.
 *
 */
export enum PipelineProfile {
  // adding a new profile includes adding:
  // - a new `PipelineProfile` member
  // - a new `stagesPresets` member
  // - a new `____Config` interface
  // - a new member in the `PiplineConfig` union
  /**
   * A profile that activates on voice activity and transcribes speech
   * using pretrained keyword recognizer models that support a limited
   * vocabulary.
   */
  Keyword = 'KEYWORD',
  /**
   * A profile that sends an `Activate` event when a wakeword is detected
   * by a set of pretrained wakeword models. Once that event is received,
   * subsequent audio should be sent to a speech recognizer for transcription.
   */
  Wakeword = 'WAKEWORD'
}

const stagesPresets = {
  [PipelineProfile.Keyword]: [Stage.VadTrigger, Stage.KeywordRecognizer],
  [PipelineProfile.Wakeword]: [Stage.WakewordTrigger]
}

/**
 * Base URLs for neural models used by various stages. There are typically
 * multiple models in a given directory, so all that's needed is the URL
 * before any filename (e.g. a URL displayed on Spokestack's site as
 * https://spokestack.io/Ub43m5/detect.tflite would be shortened to
 * https://spokestack.io/Ub43m5 for use here).
 */
interface PipelineUrls {
  keyword?: string
  wakeword?: string
}

/**
 * Basic configuration shared by all pipeline profiles.
 */
interface BaseConfig {
  baseUrls?: PipelineUrls
  keywordClasses?: undefined
  onEvent: PipelineEventHandler
  profile?: undefined
  speechConfig?: Partial<SpeechConfig>
  stages?: undefined
  workerUrl?: string
}

/**
 * A custom pipeline configuration that allows the user to
 * create and pass their own list of stage classes.
 */
interface StagesConfig {
  stages: Stage[]
}

/**
 * Configuration necessary for using the keyword recognizer.
 */
interface KeywordConfig {
  profile: PipelineProfile.Keyword
  keywordClasses: string[]
}

/**
 * Configuration necessary for using the wakeword recognizer.
 */
interface WakewordConfig {
  profile: PipelineProfile.Wakeword
}

type Overwrite<T, U> = Omit<T, keyof U> & U

/**
 * All possible pipeline configurations. See
 * PipelineProfile and the individual
 * configuration interfaces for more details.
 *
 * Specifies which pipeline components should be active.
 * Configuration includes either a profile (a predefined collection of stages),
 * or a custom list of stages. See Stage for more details.
 */
export type PipelineConfig =
  | Overwrite<BaseConfig, StagesConfig>
  | Overwrite<BaseConfig, KeywordConfig>
  | Overwrite<BaseConfig, WakewordConfig>

let pipeline: SpeechPipeline | undefined

/**
 * Create and immediately start a SpeechPipeline to process user
 * speech using the specified configuration.
 *
 * To simplify configuration, preset pipeline profiles are provided and
 * can be passed in the config object's `profile` key. See
 * PipelineProfile for more details.
 *
 * **NOTE: The speech pipeline (specifically tensorflow's webgl backend)
 * currently only works in Blink browsers
 * (Chrome, Edge, Opera, Vivaldi, Brave, and most Android browsers)
 * as it requires the use of the experimental
 * [OffscreenCanvas API](https://caniuse.com/?search=offscreencanvas).**
 *
 * First make sure to serve the web worker and tensorflow.js
 * from your node server at the expected locations.
 *
 * For example, with express:
 *
 * ```ts
 * app.use(
 *   '/spokestack-web-worker.js',
 *   express.static(`./node_modules/spokestack/dist/spokestack-web-worker.min.js`)
 * )
 * ```
 *
 * ```ts
 * // Starts a speech pipeline for wakeword processing.
 * try {
 *   await startPipeline({
 *     profile: PipelineProfile.Wakeword,
 *     baseUrls: { wakeword: 'https://s.spokestack.io/u/hgmYb/js' },
 *     onEvent: (event) => {
 *       switch (event.type) {
 *         case SpeechEventType.Activate:
 *           this.setState({ wakeword: { error: '', result: true } })
 *           break
 *         case SpeechEventType.Timeout:
 *           this.setState({ wakeword: { error: 'timeout' } })
 *           break
 *         case SpeechEventType.Error:
 *           console.error(event.error)
 *           break
 *       }
 *     }
 *   })
 * } catch (e) {
 *   console.error(e)
 * }
 * ```
 */
export async function startPipeline(config: PipelineConfig): Promise<SpeechPipeline> {
  if (pipeline) {
    pipeline.stop()
  }

  const speechConfig = {
    ...config.speechConfig
  }

  if (config.keywordClasses) {
    speechConfig.keywordClasses = config.keywordClasses
  }

  // Set base URLs
  speechConfig.baseKeywordUrl = config.baseUrls?.keyword
  speechConfig.baseWakewordUrl = config.baseUrls?.wakeword

  pipeline = new SpeechPipeline({
    speechConfig: speechConfig as SpeechConfig,
    stages: config.stages || stagesPresets[config.profile],
    onEvent: config.onEvent,
    workerUrl: config.workerUrl
  })
  return pipeline.start()
}

/**
 * Stop the speech pipeline and relinquish its resources,
 * including the microphone.
 *
 * ```ts
 * stopPipeline()
 * ```
 */
export function stopPipeline() {
  if (pipeline) {
    pipeline.stop()
    pipeline = undefined
  }
}

export { SpeechPipeline, SpeechPipelineConfig, PipelineEventHandler }
