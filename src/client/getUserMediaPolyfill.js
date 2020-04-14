// Polyfill from
// https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
if (typeof navigator !== 'undefined') {
  navigator.__polyfilledMediaDevices = true

  // Older browsers might not implement mediaDevices at all, so we set an empty object first
  if (navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {}
  }

  // Some browsers partially implement mediaDevices. We can't just assign an object
  // with getUserMedia as it would overwrite existing properties.
  // Here, we will just add the getUserMedia property if it's missing.
  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      // First get ahold of the legacy getUserMedia, if present
      // eslint-disable-next-line no-var
      var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia

      // Some browsers just don't implement it - return a rejected promise with an error
      // to keep a consistent interface
      if (!getUserMedia) {
        let error
        if (
          location.protocol !== 'https' &&
          /iPad|iPhone|iPod/.test(navigator.userAgent) &&
          !window.MSStream
        ) {
          error = 'https is required to use getUserMedia on iOS'
        } else {
          error = 'getUserMedia is not implemented in this browser'
        }
        return Promise.reject(new Error(error))
      }

      // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
      return new Promise(function (resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject)
      })
    }
  }
}
