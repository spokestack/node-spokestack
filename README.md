![Spokestack Node](./images/node-spokestack.png)

A set of tools for integration with the [Spokestack API](https://spokestack.io) in Node.js [![CircleCI](https://circleci.com/gh/spokestack/node-spokestack.svg?style=svg)](https://circleci.com/gh/spokestack/node-spokestack)

## Installation

```bash
$ npm install spokestack --save
```

## Speech-to-Text and NLU

Aside from ASR, the main way to use Spokestack is through Spokestack's [GraphQL](https://graphql.org) API, which is available at `https://api.spokestack.io/v1`. It requires [Spokestack credentials](https://spokestack.io/create) to access.

node-spokestack includes [Express middleware](#spokestackmiddleware) to help integrate a proxy for the GraphQL API into any node server. A proxy is necessary to avoid exposing your Spokestack credentials.

The API is used to synthesize text to speech using various methods including raw text, [speech markdown](https://www.speechmarkdown.org), and [SSML](https://en.wikipedia.org/wiki/Speech_Synthesis_Markup_Language).

It can also be used for [NLU classification](https://www.spokestack.io/docs/concepts/nlu).

This repo includes [an example app](examples/with-next) with sample code using [apollo](https://www.apollographql.com) to work with the GraphQL API. The example app also includes a route for viewing live docs (or "introspection") of the Spokestack api (`/graphql`).

![Spokestack GraphQL Introspection](./spokestack-graphql.png)

## Automatic Speech Recognition

The one piece missing from the Spokestack GraphQL API is ASR. This is because a websocket is needed to provide continuous processing. node-spokestack includes functions to use either [Spokestack ASR](https://www.spokestack.io/docs/concepts/asr) or [Google Cloud Speech](https://github.com/googleapis/nodejs-speech), and there are two functions for each platform.

1. A [helper function](#asrSocketServer) for adding a websocket to a node server (express or otherwise).
1. A [one-time function](#asr) for processing speech into text.

We recommend using the websocket if you need to process speech to text more than once in your application.

## Setup

Go to [spokestack.io](https://spokestack.io) and create an account. Create a token at [spokestack.io/account/settings#api](https://spokestack.io/account/settings#api). Note that you'll only be able to see the token secret once. If you accidentally leave the page, create another token. Once you have a token, set the following environment variables in your `.bash_profile` or `.zshenv`:

```bash
export SS_API_CLIENT_ID=#"Identity" field from Spokestack API token
export SS_API_CLIENT_SECRET=#"Secret key" field from Spokestack API token
```

## Using Google ASR instead of Spokestack ASR

If you'd prefer to use Google ASR, follow these [instructions for setting up Google Cloud Speech](https://github.com/googleapis/nodejs-speech#before-you-begin). Ensure `GOOGLE_APPLICATION_CREDENTIALS` is set in your environment.

---

## Convenience functions for Node.js servers

### spokestackMiddleware

▸ **spokestackMiddleware**(): function

_Defined in [server/expressMiddleware.ts:37](https://github.com/spokestack/node-spokestack/blob/cace6f3/src/server/expressMiddleware.ts#L37)_

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

**Returns:** function

### asrSocketServer

▸ **asrSocketServer**(`serverConfig`: ServerOptions, `asrConfig?`: Omit<SpokestackASRConfig, \"sampleRate\"\>): void

_Defined in [server/socketServer.ts:23](https://github.com/spokestack/node-spokestack/blob/cace6f3/src/server/socketServer.ts#L23)_

Adds a web socket server to the given HTTP server
to stream ASR using Spokestack ASR.
This uses the "ws" node package for the socket server.

```js
import { createServer } from 'http'
const port = parseInt(process.env.PORT || '3000', 10)
const server = createServer() // or express()
// Attach the websocket server to the HTTP server
asrSocketServer({ server })
server.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})
```

#### Parameters:

| Name           | Type                                       | Default value |
| -------------- | ------------------------------------------ | ------------- |
| `serverConfig` | ServerOptions                              | -             |
| `asrConfig`    | Omit<SpokestackASRConfig, \"sampleRate\"\> | {}            |

**Returns:** void

---

### googleASRSocketServer

▸ **googleASRSocketServer**(`serverConfig`: ServerOptions): void

_Defined in [server/socketServer.ts:108](https://github.com/spokestack/node-spokestack/blob/cace6f3/src/server/socketServer.ts#L108)_

Adds a web socket server to the given HTTP server
to stream ASR using Google Speech.
This uses the "ws" node package for the socket server.

```js
import { createServer } from 'http'
const port = parseInt(process.env.PORT || '3000', 10)
const server = createServer() // or express()
// Attach the websocket server to the HTTP server
googleASRSocketServer({ server })
server.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})
```

#### Parameters:

| Name           | Type          |
| -------------- | ------------- |
| `serverConfig` | ServerOptions |

**Returns:** void

### asr

▸ **asr**(`content`: string \| Uint8Array, `sampleRate`: number): Promise<string \| null\>

_Defined in [server/asr.ts:43](https://github.com/spokestack/node-spokestack/blob/cace6f3/src/server/asr.ts#L43)_

A one-off method for processing speech to text
using Spokestack ASR.

```js
import fileUpload from 'express-fileupload'
import { asr } from 'spokestack'
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
  asr(Buffer.from(audio.data.buffer), sampleRate)
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

#### Parameters:

| Name         | Type                 |
| ------------ | -------------------- |
| `content`    | string \| Uint8Array |
| `sampleRate` | number               |

**Returns:** Promise<string \| null\>

---

### googleASR

▸ **googleASR**(`content`: string \| Uint8Array, `sampleRate`: number): Promise<string \| null\>

_Defined in [server/asr.ts:97](https://github.com/spokestack/node-spokestack/blob/cace6f3/src/server/asr.ts#L97)_

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

#### Parameters:

| Name         | Type                 |
| ------------ | -------------------- |
| `content`    | string \| Uint8Array |
| `sampleRate` | number               |

**Returns:** Promise<string \| null\>

### encryptSecret

▸ **encryptSecret**(`body`: string): string

_Defined in [server/encryptSecret.ts:13](https://github.com/spokestack/node-spokestack/blob/cace6f3/src/server/encryptSecret.ts#L13)_

This is a convenience method for properly authorizing
requests to the Spokestack graphql API.

**Note:** Do not to expose your key's secret on the client.
This should only be done on the server.

See <a href="https://github.com/spokestack/node-spokestack/blob/develop/src/server/expressMiddleware.ts">server/expressMiddleware.ts</a>
for example usage.

#### Parameters:

| Name   | Type   |
| ------ | ------ |
| `body` | string |

**Returns:** string

---

## Convenience functions for the client

These functions are available exports from `spokestack/client`.

### record

▸ **record**(`config?`: RecordConfig): Promise<AudioBuffer\>

_Defined in [client/record.ts:84](https://github.com/spokestack/node-spokestack/blob/cace6f3/src/client/record.ts#L84)_

A method to record audio for a given number of seconds

```js
import { record } from 'spokestack/client'

// Record for 3 seconds and return an AudioBuffer
const buffer = await record()

// Record for 5 seconds, calling onProgress every second
const buffer = await record({
  time: 5,
  onProgress: (remaining) => {
    console.log(`Recording..${remaining}`)
  }
})

// Record for 3 seconds, calling onStart when recording starts
// Note: recording stops when the Promise resolves
const buffer = await record({
  time: 5,
  onStart: () => {
    console.log('Recording started')
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

#### Parameters:

| Name     | Type         | Default value |
| -------- | ------------ | ------------- |
| `config` | RecordConfig | { time: 3 }   |

**Returns:** Promise<AudioBuffer\>

#### RecordConfig

##### onProgress

• `Optional` **onProgress**: undefined \| (remaining: number) => void

_Defined in [client/record.ts:16](https://github.com/spokestack/node-spokestack/blob/cace6f3/src/client/record.ts#L16)_

A callback function to be called each second of recording.

##### onStart

• `Optional` **onStart**: undefined \| () => void

_Defined in [client/record.ts:14](https://github.com/spokestack/node-spokestack/blob/cace6f3/src/client/record.ts#L14)_

A callback function to be called when recording starts

##### time

• `Optional` **time**: undefined \| number

_Defined in [client/record.ts:12](https://github.com/spokestack/node-spokestack/blob/cace6f3/src/client/record.ts#L12)_

The total time to record. Default: 3

### startStream

▸ **startStream**(`__namedParameters`: { address: undefined \| string ; isPlaying: () => boolean }): Promise<WebSocket, [ProcessorReturnValue]\>

_Defined in [client/recordStream.ts:44](https://github.com/spokestack/node-spokestack/blob/cace6f3/src/client/recordStream.ts#L44)_

Returns a function to start recording using a native WebSocket.
This assumes the socket is hosted on the current server.

```js
import { startStream } from 'spokestack/client'

// ...
try {
  const [ws] = await startStream({
    address: 'wss://localhost:3000',
    isPlaying: () => this.isPlaying
  })
  ws.addEventListener('open', () => console.log('Recording started'))
  ws.addEventListener('close', () => console.log('Recording stopped'))
  ws.addEventListener('message', (e) => console.log('Speech processed: ', e.data))
} catch (e) {
  console.error(e)
}
```

#### Parameters:

| Name                | Type                                                        |
| ------------------- | ----------------------------------------------------------- |
| `__namedParameters` | { address: undefined \| string ; isPlaying: () => boolean } |

**Returns:** Promise<WebSocket, [ProcessorReturnValue]\>

---

### stopStream

▸ **stopStream**(): void

_Defined in [client/recordStream.ts:97](https://github.com/spokestack/node-spokestack/blob/cace6f3/src/client/recordStream.ts#L97)_

Stop the current recording stream if one exists.

```js
import { stopStream } from 'spokestack/client'
stopStream()
```

**Returns:** void

### convertFloat32ToInt16

▸ **convertFloat32ToInt16**(`fp32Samples`: Float32Array): Int16Array

_Defined in [client/convertFloat32ToInt16.ts:16](https://github.com/spokestack/node-spokestack/blob/cace6f3/src/client/convertFloat32ToInt16.ts#L16)_

A utility method to convert Float32Array audio
to an Int16Array to be passed directly to Speech APIs
such as Google Speech

```js
import { convertFloat32ToInt16, record } from 'spokestack/client'

const buffer = await record()
const file = new File([convertFloat32ToInt16(buffer.getChannelData(0))], 'recording.raw')
```

#### Parameters:

| Name          | Type         |
| ------------- | ------------ |
| `fp32Samples` | Float32Array |

**Returns:** Int16Array

---

### Utility functions for the client

These are low-level functions for working with your own processors, available from `spokestack/client`.

### startProcessor

▸ **startProcessor**(): Promise<Error] \| [null, [ProcessorReturnValue]\>

_Defined in [client/processor.ts:32](https://github.com/spokestack/node-spokestack/blob/cace6f3/src/client/processor.ts#L32)_

Underlying utility method for recording audio,
used by the `record` and `recordStream` methods.

While createScriptProcessor is deprecated, the replacement (AudioWorklet)
does not yet have broad support (currently only supported in Blink browsers).
See https://caniuse.com/#feat=mdn-api_audioworkletnode

We'll switch to AudioWorklet when it does.

**Returns:** Promise<Error] \| [null, [ProcessorReturnValue]\>

---

### stopProcessor

▸ **stopProcessor**(): void

_Defined in [client/processor.ts:60](https://github.com/spokestack/node-spokestack/blob/cace6f3/src/client/processor.ts#L60)_

Underlying utility method to stop the current processor
if it exists and disconnect the microphone.

**Returns:** void

#### ProcessorReturnValue

##### context

• **context**: AudioContext

_Defined in [client/processor.ts:18](https://github.com/spokestack/node-spokestack/blob/cace6f3/src/client/processor.ts#L18)_

##### processor

• **processor**: ScriptProcessorNode

_Defined in [client/processor.ts:19](https://github.com/spokestack/node-spokestack/blob/cace6f3/src/client/processor.ts#L19)_

### concatenateAudioBuffers

▸ **concatenateAudioBuffers**(`buffer1`: AudioBuffer \| null, `buffer2`: AudioBuffer \| null, `context`: AudioContext): null \| AudioBuffer

_Defined in [client/concatenateAudioBuffers.ts:4](https://github.com/spokestack/node-spokestack/blob/cace6f3/src/client/concatenateAudioBuffers.ts#L4)_

A utility method to concatenate two AudioBuffers

#### Parameters:

| Name      | Type                |
| --------- | ------------------- |
| `buffer1` | AudioBuffer \| null |
| `buffer2` | AudioBuffer \| null |
| `context` | AudioContext        |

**Returns:** null \| AudioBuffer

### countdown

▸ **countdown**(`time`: number, `progress`: (remaining: number) => void, `complete`: () => void): void

_Defined in [client/countdown.ts:7](https://github.com/spokestack/node-spokestack/blob/cace6f3/src/client/countdown.ts#L7)_

Countdown a number of seconds

#### Parameters:

| Name       | Type                        | Description                                      |
| ---------- | --------------------------- | ------------------------------------------------ |
| `time`     | number                      | Number of seconds                                |
| `progress` | (remaining: number) => void | Callback for each second (includes first second) |
| `complete` | () => void                  | Callback for completion                          |

**Returns:** void
