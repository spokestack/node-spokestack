import './getUserMediaPolyfill'

declare global {
  interface Window {
    // Support: Safari
    webkitAudioContext: AudioContext
  }
  interface Navigator {
    __polyfilledMediaDevices: boolean
  }
}

let stream: MediaStream | undefined

export function startRecord(): Promise<MediaStream | void> {
  const constraints = {
    autoGainControl: true,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true
  }
  return navigator.mediaDevices
    .getUserMedia({ audio: constraints })
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
