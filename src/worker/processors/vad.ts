import { SpeechContext, SpeechProcessor } from '../types'
import { EventType, SpeechConfig } from '../../client/types'

export default class VadTrigger implements SpeechProcessor {
  static async create(_config: SpeechConfig) {
    return new VadTrigger()
  }

  process(context: SpeechContext) {
    // dispatch pipeline events on activation edge
    if (context.isSpeech != context.isActive) {
      if (context.isSpeech) {
        context.dispatch({ eventType: EventType.Activate })
      } else {
        context.dispatch({ eventType: EventType.Deactivate })
      }
    }
    context.isActive = context.isSpeech
  }

  reset() {
    // noop
  }
}
