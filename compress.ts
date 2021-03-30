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
  console.log(minified?.length)
  fs.writeFileSync('./dist/spokestack-web-worker.min.js', license + minified)
})
