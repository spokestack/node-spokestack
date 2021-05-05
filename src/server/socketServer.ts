import spokestackService, { SpokestackASRConfig } from './spokestackASRService'
import { SpeechClient } from '@google-cloud/speech'
import WebSocket from 'ws'
import { getCookie } from '../cookies'
import { google } from '@google-cloud/speech/build/protos/protos'
import type Pumpify from 'pumpify'
import type { IncomingMessage } from 'http'

type GoogleConfig = google.cloud.speech.v1.IRecognitionConfig

export interface SetupSpokestackConfig {
  spokestack: true | Omit<SpokestackASRConfig, 'sampleRate'>
}

export interface SetupGoogleConfig {
  google: true | Omit<GoogleConfig, 'sampleRateHertz'>
}

/**
 * Create your own socket connection handler
 * This is useful if you prefer to create your own WebSocket,
 * but still want to let Spokestack handle socket connections.
 *
 * For example, using fastify:
 *
 * ```js
 * const { createSocketConnectionHandler } = require('spokestack')
 * const fastify = require('fastify')()
 * fastify.register(require('fastify-websocket'))
 *
 * const socketHandler = createSocketConnectionHandler({
 *   spokestack: true
 * })
 * fastify.get('/', { websocket: true }, (connection, req) =>
 *   socketHandler(connection.socket, req.raw)
 * )
 * ```
 */
export function createSocketConnectionHandler(config: SetupSpokestackConfig | SetupGoogleConfig) {
  const spokestack = (config as SetupSpokestackConfig).spokestack
  const google = (config as SetupGoogleConfig).google
  if (!spokestack && !google) {
    throw new Error(
      'setupSocketServer() must specify either "spokestack" or "google" in the config.'
    )
  }
  return async function onConnection(ws: WebSocket, request: IncomingMessage) {
    console.log('Websocket connection opened')
    const sampleRate = getCookie('sampleRate', request.headers.cookie)
    if (!sampleRate) {
      console.error('No sample rate cookie set')
      return
    }
    let stream: WebSocket | Pumpify
    let googleClient: SpeechClient
    try {
      if (spokestack) {
        console.log('Hooking up WebSocket to Spokestack ASR')
        const spokestackSocket = (stream = await spokestackService(
          {
            ...(spokestack === true ? {} : spokestack),
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
        ))
        ws.on('message', (message: ArrayBuffer) => {
          if (spokestackSocket.readyState === spokestackSocket.OPEN) {
            spokestackSocket.send(Buffer.from(message))
          }
        })
      } else {
        console.log('Hooking up WebSocket to Google ASR')
        googleClient = new SpeechClient()
        const streamConfig: google.cloud.speech.v1.IStreamingRecognitionConfig = {
          config: {
            encoding: 'LINEAR16',
            languageCode: 'en-US',
            ...(google === true ? {} : google),
            sampleRateHertz: parseInt(sampleRate, 10)
          },
          interimResults: true
        }
        const googleStream = (stream = googleClient
          .streamingRecognize(streamConfig)
          .on('data', (stream) => {
            if (stream.results[0] && stream.results[0].alternatives[0]) {
              ws.send(stream.results[0].alternatives[0].transcript)
            }
          }))
        ws.on('message', (message: ArrayBuffer) => {
          googleStream.write(Buffer.from(message))
        })
      }

      stream.on('error', (err: Error & { code: number }) => {
        if (err.code === 11) {
          console.log('Streaming Client Timeout')
        } else {
          console.error(`Google cloud API error ${err}`)
          try {
            if (googleClient) {
              googleClient.close()
            } else {
              ;(stream as WebSocket).close(1014)
            }
          } catch (e) {
            console.error(e)
          }
          try {
            ws.close(1014)
          } catch (e) {
            console.error(e)
          }
        }
      })
      console.log(`Spokestack streaming client created with sampleRate: ${sampleRate}`)
      ws.binaryType = 'arraybuffer'
      ws.on('close', (code, reason) => {
        console.log(`Websocket connection closed. Code: ${code}. Reason: ${reason}`)
        if (spokestack) {
          ;(stream as WebSocket).close(1000)
        } else {
          ;(stream as Pumpify).destroy()
        }
      })
    } catch (error) {
      console.error(error)
      ws.close(1002)
    }
  }
}

/**
 * Pass an existing socket server to set up
 * with Spokestack or Google ASR.
 * Specify which in the second parameter.
 *
 * ```js
 * const socketServer = new WebSocket.Server({ port: 8080 })
 * setupSocketServer(socketServer, { spokestack: true })
 * ```
 */
export function setupSocketServer(
  socketServer: WebSocket.Server,
  config: SetupSpokestackConfig | SetupGoogleConfig
) {
  const handler = createSocketConnectionHandler(config)
  socketServer.on('connection', handler)

  socketServer.on('close', () => {
    console.log('socket server closed')
  })

  socketServer.on('error', (error) => {
    console.log('Websocket server error', error)
  })
}

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
  spokestackConfig: SetupSpokestackConfig['spokestack'] = {}
) {
  const wss = new WebSocket.Server(serverConfig)
  console.log('Websocket started')
  return setupSocketServer(wss, { spokestack: spokestackConfig })
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
export function googleASRSocketServer(
  serverConfig: WebSocket.ServerOptions,
  googleConfig: SetupGoogleConfig['google'] = {}
) {
  const wss = new WebSocket.Server(serverConfig)
  console.log('Websocket started')
  return setupSocketServer(wss, { google: googleConfig })
}
