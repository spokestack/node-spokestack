import { SpeechConfig, SpeechEventType } from '../../client/types'
import { SpeechContext, SpeechProcessor } from '../types'

export default class VadTrigger implements SpeechProcessor {
  static async create(_config: SpeechConfig) {
    return new VadTrigger()
  }

  process(context: SpeechContext) {
    // dispatch pipeline events on activation edge
    if (context.isSpeech !== context.isActive) {
      if (context.isSpeech) {
        context.dispatch({ type: SpeechEventType.Activate })
      } else {
        context.dispatch({ type: SpeechEventType.Deactivate })
      }
    }
    context.isActive = context.isSpeech
  }

  reset() {
    // noop
  }
}
