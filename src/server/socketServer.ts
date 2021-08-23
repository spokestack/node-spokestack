import spokestackService, { SpokestackASRConfig } from './spokestackASRService'

import { SpeechClient } from '@google-cloud/speech'
import WebSocket from 'ws'
import { getCookie } from '../cookies'
import { google } from '@google-cloud/speech/build/protos/protos'

/**
 * Adds a web socket server to the given HTTP server
 * to stream ASR using Spokestack ASR.
 * This uses the "ws" node package for the socket server.
 *
 * ```js
 * import { createServer } from 'http'
 * const port = parseInt(process.env.PORT || '3000', 10)
 * const server = createServer() // or express()
 * // Attach the websocket server to the HTTP server
 * asrSocketServer({ server })
 * server.listen(port, () => {
 *   console.log(`Listening at http://localhost:${port}`)
 * })
 * ```
 */
export function asrSocketServer(
  serverConfig: WebSocket.ServerOptions,
  asrConfig: Omit<SpokestackASRConfig, 'sampleRate'>
): void {
  const wss = new WebSocket.Server(serverConfig)
  console.log('Websocket started')

  wss.on('connection', async (ws, request) => {
    console.log(`Websocket connected with ${wss.clients.size} clients`)
    const sampleRate = getCookie('sampleRate', request.headers.cookie)
    if (!sampleRate) {
      console.error('No sample rate cookie set')
      return
    }
    spokestackService(
      {
        ...asrConfig,
        sampleRate: parseInt(sampleRate, 10)
      },
      ({ status, hypotheses }) => {
        if (status === 'ok') {
          if (hypotheses.length) {
            ws.send(hypotheses[0].transcript)
          }
        } else {
          ws.close(1002)
        }
      }
    )
      .then((client) => {
        client.on('error', () => {
          try {
            ws.close(1014)
          } catch (e) {
            console.log('Error closing socket connection', e)
          }
        })
        console.log(`Spokestack streaming client created with sampleRate: ${sampleRate}`)
        ws.binaryType = 'arraybuffer'
        ws.on('message', (message: ArrayBuffer) => {
          if (client.readyState === client.OPEN) {
            client.send(Buffer.from(message))
          }
        })
        ws.on('close', (code, reason) => {
          console.log(
            `client closed with ${wss.clients.size} clients. Code: ${code}. Reason: ${reason}`
          )
          if (client) {
            console.log('Closing Spokestack client')
            client.close(1000)
          }
        })
      })
      .catch((error) => {
        console.error(error)
        ws.close(1002)
      })
  })

  wss.on('close', () => {
    console.log('socket server closed')
  })

  wss.on('error', (error) => {
    console.log('Websocket server error', error)
  })
}

/**
 * Adds a web socket server to the given HTTP server
 * to stream ASR using Google Speech.
 * This uses the "ws" node package for the socket server.
 *
 * ```js
 * import { createServer } from 'http'
 * const port = parseInt(process.env.PORT || '3000', 10)
 * const server = createServer() // or express()
 * // Attach the websocket server to the HTTP server
 * googleASRSocketServer({ server })
 * server.listen(port, () => {
 *   console.log(`Listening at http://localhost:${port}`)
 * })
 * ```
 */
export function googleASRSocketServer(serverConfig: WebSocket.ServerOptions): void {
  const wss = new WebSocket.Server(serverConfig)
  console.log('Websocket started')

  wss.on('connection', (ws, request) => {
    console.log(`Websocket connected with ${wss.clients.size} clients`)
    const sampleRate = getCookie('sampleRate', request.headers.cookie)
    if (!sampleRate) {
      console.error('No sample rate cookie set')
      return
    }
    const client = new SpeechClient()
    const config: google.cloud.speech.v1.IRecognitionConfig = {
      encoding: 'LINEAR16',
      languageCode: 'en-US',
      sampleRateHertz: parseInt(sampleRate, 10)
    }
    const streamConfig: google.cloud.speech.v1.IStreamingRecognitionConfig = {
      config,
      interimResults: true
    }
    const recognizeStream = client
      .streamingRecognize(streamConfig)
      .on('error', (err: Error & { code: number }) => {
        if (err.code === 11) {
          console.log('Google Speech Streaming Client Timeout')
        } else {
          console.error(`Google cloud API error ${err}`)
          try {
            client.close()
          } catch (e) {}
          try {
            ws.close(1014)
          } catch (e) {}
        }
      })
      .on('data', (stream) => {
        if (stream.results[0] && stream.results[0].alternatives[0]) {
          ws.send(stream.results[0].alternatives[0].transcript)
        }
      })
    console.log(`Google Speech streaming client created with sampleRate: ${sampleRate}`)
    ws.binaryType = 'arraybuffer'
    ws.on('message', (message: ArrayBuffer) => {
      recognizeStream.write(Buffer.from(message))
    })
    ws.on('close', () => {
      console.log(`client closed with ${wss.clients.size} clients`)
      if (recognizeStream) {
        console.log('Destroying google speech client')
        recognizeStream.destroy()
      }
    })
  })

  wss.on('close', () => {
    console.log('socket server closed')
  })

  wss.on('error', (error) => {
    console.log('Websocket server error', error)
  })
}
