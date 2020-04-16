import { SpeechClient } from '@google-cloud/speech'

/**
 * A one-off method for processing speech to text
 * using Google Speech.
 *
 *
 * ```js
 * import fileUpload from 'express-fileupload'
 * import { googleASR } from 'spokestack'
 * import express from 'express'
 *
 * const expressApp = express()
 *
 * expressApp.post('/asr', fileUpload(), (req, res) => {
 *   const sampleRate = Number(req.body.sampleRate)
 *   const audio = req.files.audio
 *   if (isNaN(sampleRate)) {
 *     res.status(400)
 *     res.send('Parameter required: "sampleRate"')
 *     return
 *   }
 *   if (!audio) {
 *     res.status(400)
 *     res.send('Parameter required: "audio"')
 *     return
 *   }
 *   googleASR(Buffer.from(audio.data.buffer), sampleRate)
 *     .then((text) => {
 *       res.status(200)
 *       res.json({ text })
 *     })
 *     .catch((error: Error) => {
 *       console.error(error)
 *       res.status(500)
 *       res.send('Unknown error during speech recognition. Check server logs.')
 *     })
 * })
 *
 * ```
 */
export async function googleASR(
  content: string | Uint8Array,
  sampleRate: number
): Promise<string | null> {
  const client = new SpeechClient()
  const fullResponse = await client.recognize({
    audio: { content },
    config: {
      sampleRateHertz: sampleRate,
      encoding: 'LINEAR16',
      languageCode: 'en-US'
    }
  })
  // console.log(fullResponse)
  const response = fullResponse[0]
  if (!response || !response.results || !response.results.length) {
    return null
  }
  return response.results
    .map((result) => (result.alternatives ? result.alternatives[0].transcript : undefined))
    .filter(Boolean)
    .join('\n')
}
