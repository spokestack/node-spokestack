/**
 * @license
 * Copyright 2021 Spokestack, Inc. All Rights Reserved.
 * Licensed under the MIT license.
 * https://github.com/spokestack/node-spokestack/blob/develop/MIT-License.txt
 */

import { SpeechConfig, SpeechEvent, SpeechEventType, Stage } from '../client/types'
import { SpeechContext, SpeechProcessor } from './types'

import KeywordRecognizer from './processors/keyword'
import VadTrigger from './processors/vad'
import WakewordTrigger from './processors/wakeword'

interface Frame {
  vad: boolean
  frame: number[]
}

interface WorkerConfig {
  speechConfig: SpeechConfig
  stages: Stage[]
}

let context: SpeechContext | undefined
let frames: Frame[] = []
let processors: SpeechProcessor[] = []

self.addEventListener('message', (event: MessageEvent) => {
  if (event.data.config) {
    const config: WorkerConfig = event.data.config
    initStages(config)
      .then(() => {
        context = initContext(config.speechConfig)
        self.postMessage({ initialized: true })
      })
      .catch(() => {
        dispatch({
          type: SpeechEventType.Error,
          error: 'unsupported_browser'
        })
      })
  } else {
    // the message should contain both a
    // 'vad' key representing speech activity
    // and an 'audio' key with raw float data
    const vad = event.data.vad
    const frame = event.data.audio

    if (context === undefined) {
      frames.push({ vad, frame })
    } else if (frames.length > 0) {
      processBuffer(context)
      processFrame(context, vad, frame)
    } else {
      context.isSpeech = vad
      processFrame(context, vad, frame)
    }
  }
})

async function initStages(config: WorkerConfig) {
  const { speechConfig, stages } = config
  const promises: Promise<SpeechProcessor>[] = []
  for (const stage of stages) {
    switch (stage) {
      case Stage.VadTrigger:
        promises.push(VadTrigger.create(speechConfig))
        break
      case Stage.WakewordTrigger:
        promises.push(WakewordTrigger.create(speechConfig))
        break
      case Stage.KeywordRecognizer:
        promises.push(KeywordRecognizer.create(speechConfig))
        break
    }
  }
  try {
    processors = await Promise.all(promises)
  } catch (e) {
    dispatch({
      type: SpeechEventType.Error,
      error: e.message
    })
  }
}

function initContext(config: SpeechConfig): SpeechContext {
  return {
    config: config,
    isActive: false,
    isSpeech: false,
    framesProcessed: 0,
    dispatch
  }
}

function dispatch(event: SpeechEvent) {
  self.postMessage(event)
}

function processBuffer(context: SpeechContext) {
  for (const f of frames) {
    const { vad, frame } = f
    processFrame(context, vad, frame)
  }
  frames = []
}

async function processFrame(context: SpeechContext, vad: boolean, frame: number[]) {
  context.isSpeech = vad
  for (const processor of processors) {
    processor.process(context, frame)
  }

  context.framesProcessed++
}
