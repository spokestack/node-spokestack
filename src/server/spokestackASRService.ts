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
   * Reset speech recognition and clear the transcript every `timeout`
   * milliseconds.
   * When no new data comes in for the given timeout,
   * the auth message is sent again to begin a new ASR transcation.
   * Set to 0 to disable.
   * Default: 3000
   */
  timeout?: number
  /**
   * Set a different location for the Spokestack socket URL.
   * This is very rarely needed.
   * Default: 'wss:api.spokestack.io/v1/asr/websocket'
   */
  spokestackUrl?: string
}

interface SpokestackAuthMessage {
  keyId: string
  signature: string
  body: string
}

export interface ASRHypothesis {
  /**
   * A number between 0 and 1 to indicate the
   * tensorflow confidence level for the given transcript.
   */
  confidence: number
  transcript: string
}

export interface SpokestackResponse {
  status: 'ok' | 'error'
  /** When the status is "error", the error message is available here. */
  error?: string
  /**
   * The `final` key is used to indicate that
   * the highest confidence transcript for the utterance is sent.
   * However, this will only be set to true after
   * signaling to Spokestack ASR that no more audio data is incoming.
   * Signal this by sending an empty buffer (e.g. `socket.send(Buffer.from(''))`).
   * See the source for `asr` for an example.
   */
  final: boolean
  /**
   * This is a list of transcripts, each associated with their own
   * confidence level from 0 to 1.
   * It is an array to allow for the possibility of multiple
   * transcripts in the API, but is almost always a list of one.
   */
  hypotheses: ASRHypothesis[]
}

/**
 * A low-level utility for working with the Spokestack ASR service directly.
 * This should not be used most of the time. It is only for
 * custom, advanced integrations.
 * See `asr` for one-off ASR and `asrSocketServer` for ASR streaming using
 * a websocket server that can be added to any node server.
 */
export default function asrService(
  config: SpokestackASRConfig,
  onData: (response: SpokestackResponse) => void
): Promise<WebSocket> {
  if (!process.env.SS_API_CLIENT_ID) {
    throw new Error('SS_API_CLIENT_ID is not set in the server environment.')
  }
  const clientId = process.env.SS_API_CLIENT_ID
  let timeout = Number(config.timeout)
  if (isNaN(timeout)) {
    timeout = 3000
  }
  const rate = Number(config.sampleRate)
  if (isNaN(rate)) {
    throw new Error(
      'sampleRate should be a number. It can be found as a property on the AudioBuffer returned from record or on the audio context returned from startStream.'
    )
  }

  // Open socket
  const socket = new WebSocket(config.spokestackUrl || 'wss:api.spokestack.io/v1/asr/websocket')

  let prevTranscript: string | null = null
  let transcriptTimeout: NodeJS.Timeout

  socket.on('close', (code) => {
    console.log(`Spokestack ASR socket closed with code: ${code}`)
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
      rate
    })
    const signature = encryptSecret(body)
    const message: SpokestackAuthMessage = {
      keyId: clientId,
      signature,
      body
    }
    socket.send(JSON.stringify(message))
  }

  socket.on('message', (data: string) => {
    // console.log('Spokestack ASR socket message', data)
    try {
      const json: SpokestackResponse = JSON.parse(data)
      if (
        json.status === 'ok' &&
        (json.final || (json.hypotheses.length && json.hypotheses[0].transcript !== prevTranscript))
      ) {
        prevTranscript = json.hypotheses[0].transcript
        // console.log('NEW TRANSCRIPT', prevTranscript)
        onData.call(null, json)

        if (timeout > 0) {
          clearTimeout(transcriptTimeout)
          transcriptTimeout = setTimeout(() => {
            sendAuth()
            prevTranscript = null
          }, timeout)
        }
      } else if (json.status === 'error') {
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
    socket.on('close', reject)
    socket.once('open', () => {
      socket.once('message', (data: string) => {
        socket.removeEventListener('error', reject)
        socket.removeEventListener('close', reject)
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
