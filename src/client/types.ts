export interface VadStatus {
  active: boolean
  changed: boolean
}

export interface VadConfig {
  bufferLen: number
  smoothingTimeConstant: number
  minCaptureFreq: number
  maxCaptureFreq: number
  noiseCaptureDuration: number
  minNoiseLevel: number
  maxNoiseLevel: number
  avgNoiseMultiplier: number
  onUpdate: (avgFreq: number) => void
  onVadChange: (status: boolean) => void
  /**
   * length of voice activity to ignore before
   * setting the VAD to active, in ms
   */
  riseDelay: number
  /**
   * length of inactivity to ignore before
   * setting the VAD to inactive, in ms
   */
  fallDelay: number
  /**
   * maximum length of time the VAD can be active,
   * in ms
   */
  maxActive: number
}

export const DefaultVadConfig: VadConfig = {
  bufferLen: 1024,
  smoothingTimeConstant: 0.2,
  minCaptureFreq: 85, // in Hz
  maxCaptureFreq: 255, // in Hz
  noiseCaptureDuration: 1, // in s
  minNoiseLevel: 0.3, // from 0 to 1
  maxNoiseLevel: 0.7, // from 0 to 1
  avgNoiseMultiplier: 1.2,
  riseDelay: 0,
  fallDelay: 250,
  maxActive: 2000,
  onUpdate: () => {
    // noop
  },
  onVadChange: () => {
    // noop
  }
}

export interface SpeechConfig {
  sampleRate: number
  /**
   * size of the signal window used to filter incoming audio,
   * in number of samples - should be a power of 2
   */
  fftWidth: number
  /**
   * length of time to skip each time the overlapping FFT is calculated,
   * in milliseconds
   */
  hopLength: number
  /**
   * length of mel spectrogram used as input to the wakeword/keyword encoder,
   * in milliseconds
   */
  melLength?: number
  /** number of filterbank components in each mel spectrogram frame
   *  for wakeword/keyword models
   */
  melWidth?: number
  /** size of the encoder output vector in wakeword/keyword models **/
  encodeWidth?: number
  /** confidence threshold below which wakeword detections are
   *  considered invalid
   */
  wakeThreshold?: number
  /** confidence threshold below which keyword detections are
   *  considered invalid
   */
  keywordThreshold?: number
  /** text labels for keyword model classes **/
  keywordClasses?: string[]
  /** base URL for downloading keyword models **/
  baseKeywordUrl?: string
  /** base URL for downloading wakeword models **/
  baseWakewordUrl?: string
  /** configuration unique to the VAD module **/
  vad?: VadConfig
}

export enum EventType {
  Activate = 'ACTIVATE',
  Deactivate = 'DEACTIVATE',
  Timeout = 'TIMEOUT',
  Recognize = 'RECOGNIZE',
  Error = 'ERROR'
}

export interface SpeechEvent {
  transcript?: string
  confidence?: number
  error?: string
  eventType: EventType
}

export enum Stage {
  VadTrigger = 'vadTrigger',
  WakewordTrigger = 'wakeword',
  KeywordRecognizer = 'keyword'
}
