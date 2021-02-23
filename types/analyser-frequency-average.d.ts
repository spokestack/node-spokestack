declare module 'analyser-frequency-average' {
  export default function analyserFrequencyAverage(
    analyser: AnalyserNode,
    frequencies: Uint8Array,
    minHz: number,
    maxHz: number
  )
}
