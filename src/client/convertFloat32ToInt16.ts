export default function convertFloat32ToInt16(fp32Samples: Float32Array) {
  return new Int16Array(fp32Samples.map((value) => value * 32767))
}
