/**
 * Countdown a number of seconds
 * @param {number} time Number of seconds
 * @param {Function} progress Callback for each second (includes first second)
 * @param {Function} complete Callback for completion
 */
export default function countdown(
  time: number,
  progress: (remaining: number) => void,
  complete: () => void
) {
  time = time >> 0
  if (time > 0) {
    progress(time)
    setTimeout(() => countdown(time - 1, progress, complete), 1000)
  } else {
    complete()
  }
}
