import { convertFloat32ToInt16 } from 'spokestack/client'

export default function upload(audioBuffer: AudioBuffer) {
  const formData = new FormData()
  formData.append('sampleRate', audioBuffer.sampleRate + '')
  formData.append(
    'audio',
    new File(
      // Convert to LINEAR16 on the front-end instead of the server.
      // This took <10ms in our testing even on a slow phone.
      // It cuts the data over the wire to 1/4 the size.
      [convertFloat32ToInt16(audioBuffer.getChannelData(0))],
      'recording.raw'
    )
  )
  return fetch('/asr', {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json'
    }
  })
    .then((res) => {
      if (!res.ok) {
        console.log(`Response status: ${res.status}`)
      }
      return res.json()
    })
    .catch(console.error.bind(console))
}
