import {
  asr,
  asrSocketServer,
  googleASR,
  googleASRSocketServer,
  spokestackMiddleware
} from 'spokestack'
import fileUpload, { UploadedFile } from 'express-fileupload'

import type { Socket } from 'net'
import WebSocket from 'ws'
import bodyParser from 'body-parser'
import { createServer } from 'http'
import express from 'express'
import next from 'next'
import searchGitHub from './searchGitHub'

const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()
const useGoogleAsr = process.env.ASR_SERVICE === 'google'

app.prepare().then(() => {
  const expressApp = express()
  const middleware = spokestackMiddleware({
    clientId: process.env.SS_API_CLIENT_ID!,
    clientSecret: process.env.SS_API_CLIENT_SECRET!
  })

  expressApp.use(
    '/spokestack-web-worker.js',
    express.static(`./node_modules/spokestack/dist/spokestack-web-worker${dev ? '' : '.min'}.js`)
  )

  expressApp.use('/graphql', bodyParser.json(), (req, res) => {
    const accept = req.headers.accept || ''
    // Show the playground only in development
    if (
      process.env.NODE_ENV !== 'production' &&
      accept.includes('text/html') &&
      !accept.includes('json')
    ) {
      const playground = require('graphql-playground-middleware-express').default
      return playground({
        endpoint: '/graphql',
        settings: {
          'request.credentials': 'same-origin'
        }
      })(req, res)
    }
    return middleware(req, res)
  })

  expressApp.post('/asr', fileUpload(), (req, res) => {
    if (!req.body || !req.body.sampleRate) {
      res.status(400)
      res.json({
        message: 'Parameter required: "sampleRate"'
      })
      return
    }
    if (!req.files || !req.files.audio) {
      res.status(400)
      res.json({
        message: 'Parameter required: "audio"'
      })
      return
    }
    const audio = req.files.audio as UploadedFile
    const content = Buffer.from(audio.data.buffer)
    // writeFileSync(path.join(__dirname, '..', '.files/audio.int16'), content)
    if (!content) {
      res.status(400)
      res.json({
        message: 'The audio file is not valid.'
      })
      return
    }
    const fetcher = useGoogleAsr
      ? googleASR(content, Number(req.body.sampleRate))
      : asr(content, {
          clientId: process.env.SS_API_CLIENT_ID!,
          clientSecret: process.env.SS_API_CLIENT_SECRET!,
          sampleRate: Number(req.body.sampleRate)
        })
    fetcher
      .then((text) => {
        res.status(200)
        res.json({ text })
      })
      .catch((error: Error) => {
        console.error(error)
        if (error.message.includes('Authentication')) {
          res.status(400)
          res.json({
            message: 'Spokestack Authentication Failed. Please check credentials.'
          })
          return
        }
        res.status(500)
        res.json({
          message: 'Unknown error during speech recognition. Check server logs.'
        })
      })
  })

  expressApp.post('/search', bodyParser.json(), (req, res) => {
    if (!req.body || !req.body.term) {
      res.status(400).json({
        message: 'Parameter required: "term"'
      })
      return
    }
    searchGitHub(req.body.term)
      .then((result) => {
        res.json(result)
      })
      .catch((err) => {
        console.error(err)
        res.status(500)
        res.json({
          message: 'Unknown error during GitHub search. Check server logs.'
        })
      })
  })

  expressApp.all('*', (req, res) => handle(req, res))

  const server = createServer(expressApp)
  let wss: WebSocket.Server
  if (useGoogleAsr) {
    wss = googleASRSocketServer({ noServer: true })
  } else {
    wss = asrSocketServer(
      { noServer: true },
      {
        clientId: process.env.SS_API_CLIENT_ID!,
        clientSecret: process.env.SS_API_CLIENT_SECRET!
      }
    )
  }

  server.on('upgrade', (req, socket, head) => {
    // nextjs now uses a websocket for hot module reloading.
    // See https://github.com/vercel/next.js/commit/75748caf7f0617f14766fa3aa0286c7488308408
    // Handle the websocket connection only if
    // the path does not contain '_next'.
    if (!req.url?.includes('_next')) {
      wss.handleUpgrade(req, socket as Socket, head, (ws) => {
        wss.emit('connection', ws, req)
      })
    }
  })
  server.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
  })
})
