# Spokestack [![CircleCI](https://circleci.com/gh/spokestack/node-spokestack.svg?style=svg)](https://circleci.com/gh/spokestack/node-spokestack)

A set of tools for integration with the [Spokestack API](https://spokestack.io) in Node.js

This package is a work in progress.

## Installation

```bash
$ npm install spokestack --save
```

## Requirements

1. Go to [spokestack.io](https://spokestack.io) and create an account. Create a token at [spokestack.io/account/settings#api](https://spokestack.io/account/settings#api). Note that you'll only be able to see the token secret once. If you accidentally leave the page, create another token. Once you have a token, set the following environment variables in your `.bash_profile` or `.zshenv`:

```bash
export SS_API_URL=https://api.spokestack.io
export SS_API_CLIENT_ID=#"Identity" field from Spokestack API token
export SS_API_CLIENT_SECRET=#"Secret key" field from Spokestack API token
```

2. [Set up Google Cloud Speech](https://github.com/googleapis/nodejs-speech#before-you-begin). Ensure `GOOGLE_APPLICATION_CREDENTIALS` is set in your environment.

---

## Convenience functions for Node.js servers

### googleASR

▸ **googleASR**(`content`: string | Uint8Array, `sampleRate`: number): _Promise‹string | null›_

_Defined in [server/asr.ts:42](https://github.com/spokestack/node-spokestack/blob/811a05d/src/server/asr.ts#L42)_

A one-off method for processing speech to text
using Google Speech.

```js
import fileUpload from 'express-fileupload'
import { googleASR } from 'spokestack'
import express from 'express'

const expressApp = express()

expressApp.post('/asr', fileUpload(), (req, res) => {
  const sampleRate = Number(req.body.sampleRate)
  const audio = req.files.audio
  if (isNaN(sampleRate)) {
    res.status(400)
    res.send('Parameter required: "sampleRate"')
    return
  }
  if (!audio) {
    res.status(400)
    res.send('Parameter required: "audio"')
    return
  }
  googleASR(Buffer.from(audio.data.buffer), sampleRate)
    .then((text) => {
      res.status(200)
      res.json({ text })
    })
    .catch((error: Error) => {
      console.error(error)
      res.status(500)
      res.send('Unknown error during speech recognition. Check server logs.')
    })
})
```

**Parameters:**

| Name         | Type                     |
| ------------ | ------------------------ |
| `content`    | string &#124; Uint8Array |
| `sampleRate` | number                   |

**Returns:** _Promise‹string | null›_

### spokestackMiddleware

▸ **spokestackMiddleware**(): _function_

_Defined in [server/express-spokestack-middleware.ts:36](https://github.com/spokestack/node-spokestack/blob/811a05d/src/server/express-spokestack-middleware.ts#L36)_

Express middleware for adding a proxy to the Spokestack GraphQL API.
A proxy is necessary to avoid exposing your Spokestack token secret on the client.
Once a graphql route is in place, your client
can use that with <a href="https://graphql.org/">GraphQL</a>.

```js
import { spokestackMiddleware } from 'spokestack'
import bodyParser from 'body-parser'
import express from 'express'

const expressApp = express()

expressApp.post('/graphql', bodyParser.json(), spokestackMiddleware())
```

This is also convenient for setting up <a href="https://github.com/graphql/graphiql">graphiql introspection</a>.
An example fetcher for graphiql on the client (browser only) might look like this:

```js
const graphQLFetcher = (graphQLParams) =>
  fetch('/graphql', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(graphQLParams)
  })
    .then((response) => response.json())
    .catch((response) => response.text())
```

**Returns:** _function_

▸ (`req`: Request, `res`: Response): _void_

**Parameters:**

| Name  | Type     |
| ----- | -------- |
| `req` | Request  |
| `res` | Response |

### googleASRSocketServer

▸ **googleASRSocketServer**(`server`: Server): _void_

_Defined in [server/spokestack-socket-server.ts:22](https://github.com/spokestack/node-spokestack/blob/811a05d/src/server/spokestack-socket-server.ts#L22)_

Adds a web socket server to the given HTTP server
to stream ASR using Google Speech.
This uses the "ws" node package for the socket server.

```js
import { createServer } from 'http'
const port = parseInt(process.env.PORT || '3000', 10)
const server = createServer() // Optionally pass an express app
googleASRSocketServer(server)
server.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})
```

**Parameters:**

| Name     | Type   |
| -------- | ------ |
| `server` | Server |

**Returns:** _void_

### encryptSecret

▸ **encryptSecret**(`body`: string): _string_

_Defined in [server/encryptSecret.ts:13](https://github.com/spokestack/node-spokestack/blob/811a05d/src/server/encryptSecret.ts#L13)_

This is a convenience method for properly authorizing
requests to the Spokestack graphql API.

**Note:** Do not to expose your key's secret on the client.
This should only be done on the server.

See <a href="https://github.com/spokestack/node-spokestack/blob/develop/src/server/express-spokestack-middleware.ts">server/express-spokestack-middleware.ts</a>
for example usage.

**Parameters:**

| Name   | Type   |
| ------ | ------ |
| `body` | string |

**Returns:** _string_

---

## Convenience functions for the client

These functions are available exports from `spokestack/client`.

### record

▸ **record**(`config`: RecordConfig): _Promise‹AudioBuffer›_

_Defined in [client/record.ts:69](https://github.com/spokestack/node-spokestack/blob/811a05d/src/client/record.ts#L69)_

A method to record audio for a given number of seconds

```js
import { record } from 'spokestack/client'

const buffer = await record({
  time: 3,
  onProgress: (remaining) => {
    console.log(`Recording..${remaining}`)
  }
})
```

Then create a file for uploading
See <a href="#googleASR">googleASR</a> for an example on how
to process the resulting audio file

```js
import { convertFloat32ToInt16 } from 'spokestack/client'

const sampleRate = buffer.sampleRate
const file = new File(
  // Convert to LINEAR16 on the front-end instead of the server.
  // This took <10ms in our testing even on a slow phone.
  // It cuts the data over the wire to 1/4 the size.
  [convertFloat32ToInt16(buffer.getChannelData(0))],
  'recording.raw'
)
```

The file can then be uploaded using FormData:

```js
const formData = new FormData()
formData.append('sampleRate', sampleRate + '')
formData.append('audio', file)
fetch('/asr', {
  method: 'POST',
  body: formData,
  headers: { Accept: 'application/json' }
})
  .then((res) => {
    if (!res.ok) {
      console.log(`Response status: ${res.status}`)
    }
    return res.json()
  })
  .then(({ text }) => console.log('Processed speech', text))
  .catch(console.error.bind(console))
```

**Parameters:**

| Name     | Type         | Default     |
| -------- | ------------ | ----------- |
| `config` | RecordConfig | { time: 3 } |

**Returns:** _Promise‹AudioBuffer›_

#### RecordConfig

##### `Optional` onProgress

• **onProgress**? : _undefined | function_

_Defined in [client/record.ts:14](https://github.com/spokestack/node-spokestack/blob/811a05d/src/client/record.ts#L14)_

A callback function to be called each second of recording.

##### `Optional` time

• **time**? : _undefined | number_

_Defined in [client/record.ts:12](https://github.com/spokestack/node-spokestack/blob/811a05d/src/client/record.ts#L12)_

The total time to record. Default: 3

### startStream

▸ **startStream**(`isPlaying`: function): _Promise‹WebSocket›_

_Defined in [client/recordStream.ts:26](https://github.com/spokestack/node-spokestack/blob/811a05d/src/client/recordStream.ts#L26)_

Returns a function to start recording using a native WebSocket.
This assumes the socket is hosted on the current server.

**Parameters:**

▪ **isPlaying**: _function_

A function returning whether audio is currently playing.
This is necessary to prevent recording played audio.

```js
import { startStream } from 'spokestack/client'
try {
  const ws = await startStream(() => isPlaying)
  ws.addEventListener('open', () => console.log('Recording started'))
  ws.addEventListener('close', () => console.log('Recording stopped'))
  ws.addEventListener('message', (e) => console.log('Speech processed: ', e.data))
} catch (e) {
  console.error(e)
}
```

▸ (): _boolean_

**Returns:** _Promise‹WebSocket›_

---

### stopStream

▸ **stopStream**(): _void_

_Defined in [client/recordStream.ts:69](https://github.com/spokestack/node-spokestack/blob/811a05d/src/client/recordStream.ts#L69)_

Stop the current recording stream if one exists.

```js
import { stopStream } from 'spokestack/client'
stopStream()
```

**Returns:** _void_

### convertFloat32ToInt16

▸ **convertFloat32ToInt16**(`fp32Samples`: Float32Array): _Int16Array‹›_

_Defined in [client/convertFloat32ToInt16.ts:16](https://github.com/spokestack/node-spokestack/blob/811a05d/src/client/convertFloat32ToInt16.ts#L16)_

A utility method to convert Float32Array audio
to an Int16Array to be passed directly to Speech APIs
such as Google Speech

```js
import { convertFloat32ToInt16, record } from 'spokestack/client'

const buffer = await record()
const file = new File([convertFloat32ToInt16(buffer.getChannelData(0))], 'recording.raw')
```

**Parameters:**

| Name          | Type         |
| ------------- | ------------ |
| `fp32Samples` | Float32Array |

**Returns:** _Int16Array‹›_
