import { Server } from 'http'
import { SpeechClient } from '@google-cloud/speech'
import WebSocket from 'ws'
import { getCookie } from '../cookies'
import { google } from '@google-cloud/speech/build/protos/protos'

/**
 * Adds a web socket server to the given HTTP server
 * to stream ASR using Google Speech.
 *
 * ```js
 * import { createServer } from 'http'
 * const port = parseInt(process.env.PORT || '3000', 10)
 * const server = createServer() // Optionally pass an express app
 * googleASRSocketServer(server)
 * server.listen(port, () => {
 *   console.log(`Listening at http://localhost:${port}`)
 * })
 * ```
 */
export function googleASRSocketServer(server: Server): void {
  const wss = new WebSocket.Server({ server })
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
            ws.close()
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
