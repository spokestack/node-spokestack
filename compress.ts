import { minify } from 'terser'
const fs = require('fs')

const license = fs.readFileSync('./WORKER_LICENSES.txt', 'utf8')
const code = fs.readFileSync('./dist/spokestack-web-worker.js', 'utf8')
minify(code, {
  format: {
    comments: false
  },
  compress: {
    typeofs: false
  }
}).then((result) => {
  const minified = result.code
  console.log(`Worker minified size: ${(Math.floor(minified?.length / 10) * 10) / 1000}kb`)
  fs.writeFileSync('./dist/spokestack-web-worker.min.js', license + minified)
})
