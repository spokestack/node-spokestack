import { SpeechClient } from '@google-cloud/speech'

export async function googleASR(content: string | Uint8Array, sampleRate: number) {
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
