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

export async function startRecord(): Promise<MediaStream> {
  const constraints = {
    autoGainControl: true,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true
  }
  const s = await navigator.mediaDevices.getUserMedia({ audio: constraints })
  return (stream = s)
}

export function stopRecord() {
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop()
    })
  }
  stream = undefined
}
