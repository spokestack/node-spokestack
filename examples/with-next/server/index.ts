import fileUpload, { UploadedFile } from 'express-fileupload'
import {
  googleASR,
  googleASRSocketServer,
  spokestackMiddleware
} from 'spokestack'
import bodyParser from 'body-parser'
import { createServer } from 'http'
import express from 'express'
import next from 'next'
import searchGitHub from './searchGitHub'

const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const expressApp = express()

  expressApp.post('/graphql', bodyParser.json(), spokestackMiddleware())

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
    googleASR(content, Number(req.body.sampleRate))
      .then((text) => {
        res.status(200)
        res.json({ text })
      })
      .catch((error: Error) => {
        console.error(error)
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
  googleASRSocketServer(server)
  server.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
  })
})
