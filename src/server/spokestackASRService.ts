import WebSocket from 'ws'
import encryptSecret from './encryptSecret'

export enum ASRFormat {
  LINEAR16 = 'PCM16LE'
}

export interface SpokestackASRConfig {
  format?: ASRFormat
  language?: 'en'
  limit?: number
  sampleRate: number
  /**
   * This timeout is for resetting the speech recognition
   * and clearing the transcript.
   * When no new data comes in for the given timeout,
   * the auth message is sent again to begin a new ASR transcation.
   * Set to 0 to disable.
   * Default: 3000
   */
  timeout?: number
}

interface SpokestackMessage {
  keyId: string
  signature: string
  body: string
}

interface ASRHypothesis {
  confident: number
  transcript: string
}

interface SpokestackResponse {
  status: 'ok' | 'error'
  error?: string
  final: boolean
  hypotheses: ASRHypothesis[]
}

export default function asrService(
  config: SpokestackASRConfig,
  onData: (response: SpokestackResponse) => void
): Promise<WebSocket> {
  if (!process.env.SS_API_URL) {
    throw new Error('SS_API_URL is not set in the server environment.')
  }
  if (!process.env.SS_API_CLIENT_ID) {
    throw new Error('SS_API_CLIENT_ID is not set in the server environment.')
  }
  const apiUrl = new URL(process.env.SS_API_URL)
  const clientId = process.env.SS_API_CLIENT_ID
  const timeout = config.timeout || 3000

  // Open socket
  const socket = new WebSocket(`wss:${apiUrl.hostname}/v1/asr/websocket`)

  let prevTranscript = ''
  let transcriptTimeout: NodeJS.Timeout

  socket.on('close', () => {
    clearTimeout(transcriptTimeout)
  })
  socket.on('error', function error(err: Error) {
    clearTimeout(transcriptTimeout)
    console.error(`Spokestack ASR error ${err}`)
    if (!socket.CLOSED) {
      socket.terminate()
    }
  })

  // Encrypt a stringified body and send the message
  function sendAuth() {
    console.log('Sending AUTH message')
    const body = JSON.stringify({
      format: config.format || ASRFormat.LINEAR16,
      language: config.language || 'en',
      limit: config.limit || 1,
      rate: config.sampleRate
    })
    const signature = encryptSecret(body)
    const message: SpokestackMessage = {
      keyId: clientId,
      signature,
      body
    }
    socket.send(JSON.stringify(message))
  }

  socket.on('message', (data: string) => {
    console.log('Message', data)
    try {
      const json: SpokestackResponse = JSON.parse(data)
      if (
        timeout > 0 &&
        json.status === 'ok' &&
        json.hypotheses.length &&
        json.hypotheses[0].transcript &&
        json.hypotheses[0].transcript !== prevTranscript
      ) {
        prevTranscript = json.hypotheses[0].transcript
        console.log('NEW TRANSCRIPT', prevTranscript)
        clearTimeout(transcriptTimeout)
        transcriptTimeout = setTimeout(() => {
          sendAuth()
          prevTranscript = ''
        }, timeout)
        onData.call(null, json)
      }
    } catch (e) {
      console.error('Data format from Spokestack ASR is unexpected')
      console.log(data)
      socket.close(1014)
    }
  })

  return new Promise((resolve, reject) => {
    socket.on('error', reject)
    socket.once('open', () => {
      socket.once('message', (data: string) => {
        console.log('Auth response', data)
        socket.removeEventListener('error', reject)
        try {
          const json: SpokestackResponse = JSON.parse(data)
          if (json.status === 'ok') {
            resolve(socket)
          } else {
            console.log(data)
            reject(new Error('[Spokestack ASR]: Invalid Authentication message'))
          }
        } catch (e) {
          console.error('Data format of auth response is unexpected')
          console.log(data)
          socket.close(1014)
          reject(new Error('[Spokestack ASR] Unexpected message format from Spokestack ASR'))
        }
      })
      sendAuth()
    })
  })
}
