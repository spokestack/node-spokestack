import './getUserMediaPolyfill'

let stream: MediaStream | undefined

export function startRecord(): Promise<MediaStream | void> {
  return navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((s) => (stream = s))
    .catch(console.error.bind(console))
}

export function stopRecord() {
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop()
    })
  }
  stream = undefined
}
