![node-spokestack](./images/node-spokestack.png)

A set of tools for integration with the [Spokestack API](https://spokestack.io) in Node.js [![CircleCI](https://circleci.com/gh/spokestack/node-spokestack.svg?style=svg)](https://circleci.com/gh/spokestack/node-spokestack)

## Installation

```bash
$ npm install spokestack --save
```

## Features

Spokestack has all the tools you need to build amazing user experiences for speech. Here are some of the features included in node-spokestack:

#### Automatic Speech Recognition (ASR)

We provide multiple ways to hook up either [Spokestack ASR](https://www.spokestack.io/docs/concepts/asr) or [Google Cloud Speech](https://github.com/googleapis/nodejs-speech) to your node/express server, including asr functions for one-off ASR requests and websocket server integrations for ASR streaming. Or, use the ASR services directly for more advanced integrations.

#### Text-to-Speech (TTS)

Through the use of our [GraphQL](https://graphql.org) API (see below), Spokestack offers multiple ways to generate voice audio from text. Send raw text, [speech markdown](https://www.speechmarkdown.org), or [SSML](https://en.wikipedia.org/wiki/Speech_Synthesis_Markup_Language) and get back a URL for audio to play in the browser.

#### Wake word and Keyword Recognition

Wake word and keyword recognition are supported through the use of our speech pipeline (see [startPipeline](https://github.com/spokestack/node-spokestack#startpipeline)). One of the most powerful features we provide is the ability to define and train custom wake word and keyword models directly on [spokestack.io](https://www.spokestack.io/account). When training is finished, we host the model files for you on a CDN. Pass the CDN URLs to `startPipeline()` and the Speech Pipeline will start listening These same models can be used in [spokestack-python](https://github.com/spokestack/spokestack-python), [spokestack-android](https://github.com/spokestack/spokestack-android), [spokestack-ios](https://github.com/spokestack/spokestack-ios), and [react-native-spokestack](https://github.com/spokestack/react-native-spokestack). The pipeline uses a web worker in the browser to keep all of the speech processing off the main thread so your UI never gets blocked. **NOTE: The speech pipeline (specifically tensorflow's webgl backend) currently only works in Blink browsers (Chrome, Edge, Opera, Vivaldi, Brave, and most Android browsers) as it requires the use of the experimental [OffscreenCanvas API](https://caniuse.com/?search=offscreencanvas). Firefox is close to full support for that API, and we'll look into supporting Firefox when that's available.**

#### Natural Language Understanding (NLU)

The [GraphQL](https://graphql.org) API (see below) also provides a way to convert the text from ASR to actionable "intents", or functions that apps can understand. For instance, if a user says, "Find a recipe for chocolate cake", an NLU might return a "SEARCH_RECIPE" intent. To use the NLU, you'll need an NLU model. While we have plans to release an NLU editor, the best way right now to create an NLU model is to use Alexa, DialogFlow, or Jovo and [upload the exported model to your Spokestack account](https://www.spokestack.io/docs/concepts/export). We support exports from all of those platforms.

**node-spokestack includes [an example app](https://github.com/spokestack/node-spokestack/tree/develop/examples/with-next) that demonstrates ASR, speech-to-text, and wake word and keyword processing. It also includes a route for viewing live docs (or "introspection") of the Spokestack API (`/graphql`).**

## Usage

#### The GraphQL API (TTS and NLU)

Text-to-Speech and Natural Language Understanding are available through Spokestack's [GraphQL](https://graphql.org) API, which is available at `https://api.spokestack.io/v1`. It requires [Spokestack credentials](https://www.spokestack.io/create) to access (creating an account is quick and free).

To use the GraphQL API, node-spokestack includes [Express middleware](https://github.com/spokestack/node-spokestack#spokestackmiddleware) to help integrate a proxy into any node/express server. A proxy is necessary to avoid exposing your Spokestack credentials.

Synthesize text-to-speech using various methods including raw text, [speech markdown](https://www.speechmarkdown.org), and [SSML](https://en.wikipedia.org/wiki/Speech_Synthesis_Markup_Language).

**Note**: The `voice` argument for all three TTS queries may be changed if you have created a custom voice using a [Spokestack Maker account](https://www.spokestack.io/pricing#maker) (use the string from your voice's "name" field). Otherwise, Spokestack's Free "demo-male" voice is used.

It can also be used for [NLU classification](https://www.spokestack.io/docs/concepts/nlu).

![Spokestack GraphQL Introspection](./spokestack-graphql.png)

#### Automatic Speech Recognition (ASR)

ASR is accomplished through the use of a websocket (rather than GraphQL). node-spokestack includes functions to use either [Spokestack ASR](https://www.spokestack.io/docs/concepts/asr) or [Google Cloud Speech](https://github.com/googleapis/nodejs-speech), and there are two functions for each platform.

1. A [helper function](https://github.com/spokestack/node-spokestack#asrsocketserver) for adding a websocket to a node server (express or otherwise). This is the main way to use ASR.
1. A [function](https://github.com/spokestack/node-spokestack#asr) for processing speech into text in one-off requests. This is useful if you have all of the speech up-front.

##### Using Google ASR instead of Spokestack ASR

If you'd prefer to use Google ASR, follow these [instructions for setting up Google Cloud Speech](https://github.com/googleapis/nodejs-speech#before-you-begin). Ensure `GOOGLE_APPLICATION_CREDENTIALS` is set in your environment, and then use the `googleASR` and `googleASRSocketServer` functions instead of their Spokestack equivalents.

#### Wake Word and Keyword (Speech Pipeline)

The speech pipeline uses a custom build of [Tensorflow JS](https://github.com/tensorflow/tfjs) in a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) to process speech. It notifies the user when something matches the specified wake word or keyword models. The main function for this is the [`startPipeline()`](#startPipeline) function. To use `startPipeline()`, you'll need to serve the web worker from your node/express server. Our [example next.js app](examples/with-next) demonstrates how you might accomplish this in express:

```ts
app.use(
  '/spokestack-web-worker.js',
  express.static('./node_modules/spokestack/dist/spokestack-web-worker.min.js')
)
```

With these made available to your front-end, the speech pipeline can be started.

Another option is to copy the file from node_modules to your static/public folder during your build process.

```json
// In package.json
"scripts": {
  // ...
  "copy:spokestack": "cp node_modules/spokestack/dist/spokestack-web-worker.min.js public/spokestack-web-worker.js",
  "build": "npm run copy:spokestack && next build"
}
```

## Setup

Go to [spokestack.io](https://spokestack.io) and create an account. Create a token at [spokestack.io/account/settings#api](https://spokestack.io/account/settings#api). Note that you'll only be able to see the token secret once. If you accidentally leave the page, create another token.

Once you have a token, add them using a strategy that does not expose them to the public. We recommend not comitting them to git and instead using environment variables. Then pass them to the appropriate spokestack functions. See the example app for an example.

---

## Convenience functions for Node.js servers

### spokestackMiddleware

▸ **spokestackMiddleware**(`userConfig`): (`req`: `Request`, `res`: `Response`) => `void`

Express middleware for adding a proxy to the Spokestack GraphQL API.
A proxy is necessary to avoid exposing your Spokestack token secret on the client.
Once a graphql route is in place, your client
can use that with <a href="https://graphql.org/">GraphQL</a>.

**`example`**

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

#### Parameters

| Name         | Type                                    |
| :----------- | :-------------------------------------- |
| `userConfig` | `[SpokestackConfig](#SpokestackConfig)` |

#### Returns

`fn`

▸ (`req`, `res`): `void`

Express middleware for adding a proxy to the Spokestack GraphQL API.
A proxy is necessary to avoid exposing your Spokestack token secret on the client.
Once a graphql route is in place, your client
can use that with <a href="https://graphql.org/">GraphQL</a>.

**`example`**

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

##### Parameters

| Name  | Type       |
| :---- | :--------- |
| `req` | `Request`  |
| `res` | `Response` |

##### Returns

`void`

#### Defined in

[server/expressMiddleware.ts:55](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/expressMiddleware.ts#L55)

### asrSocketServer

▸ **asrSocketServer**(`serverConfig`, `asrConfig`): `WebSocket.Server`

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

#### Parameters

| Name           | Type                                                                   |
| :------------- | :--------------------------------------------------------------------- |
| `serverConfig` | `ServerOptions`                                                        |
| `asrConfig`    | `Omit`<`[SpokestackASRConfig](#SpokestackASRConfig)`, `"sampleRate"`\> |

#### Returns

`WebSocket.Server`

#### Defined in

[server/socketServer.ts:24](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/socketServer.ts#L24)

#### SpokestackASRConfig

##### clientId

• **clientId**: `string`

clientID and clientSecret are required to use Spokestack's public API
These API keys are free and can be generated
in your spokestack.io account settings

#### Defined in

[server/spokestackASRService.ts:14](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/spokestackASRService.ts#L14)

##### clientSecret

• **clientSecret**: `string`

#### Defined in

[server/spokestackASRService.ts:15](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/spokestackASRService.ts#L15)

##### format

• `Optional` **format**: `LINEAR16`

#### Defined in

[server/spokestackASRService.ts:16](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/spokestackASRService.ts#L16)

##### language

• `Optional` **language**: `"en"`

#### Defined in

[server/spokestackASRService.ts:17](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/spokestackASRService.ts#L17)

##### limit

• `Optional` **limit**: `number`

#### Defined in

[server/spokestackASRService.ts:18](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/spokestackASRService.ts#L18)

##### sampleRate

• **sampleRate**: `number`

#### Defined in

[server/spokestackASRService.ts:19](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/spokestackASRService.ts#L19)

##### spokestackHostname

• `Optional` **spokestackHostname**: `string`

Set a different location for the Spokestack domain.
This is rarely needed.
Spokestack uses this internally to test integration.
Default: 'api.spokestack.io'

#### Defined in

[server/spokestackASRService.ts:35](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/spokestackASRService.ts#L35)

##### timeout

• `Optional` **timeout**: `number`

Reset speech recognition and clear the transcript every `timeout`
milliseconds.
When no new data comes in for the given timeout,
the auth message is sent again to begin a new ASR transcation.
Set to 0 to disable.
Default: 3000

#### Defined in

[server/spokestackASRService.ts:28](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/spokestackASRService.ts#L28)

### asr

▸ **asr**(`content`, `config`): `Promise`<`string` \| `null`\>

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

#### Parameters

| Name      | Type                                          |
| :-------- | :-------------------------------------------- |
| `content` | `string` \| `Uint8Array`                      |
| `config`  | `[SpokestackASRConfig](#SpokestackASRConfig)` |

#### Returns

`Promise`<`string` \| `null`\>

#### Defined in

[server/asr.ts:44](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/asr.ts#L44)

### googleASRSocketServer

▸ **googleASRSocketServer**(`serverConfig`): `WebSocket.Server`

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

#### Parameters

| Name           | Type            |
| :------------- | :-------------- |
| `serverConfig` | `ServerOptions` |

#### Returns

`WebSocket.Server`

#### Defined in

[server/socketServer.ts:111](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/socketServer.ts#L111)

### googleASR

▸ **googleASR**(`content`, `sampleRate`): `Promise`<`string` \| `null`\>

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

#### Parameters

| Name         | Type                     |
| :----------- | :----------------------- |
| `content`    | `string` \| `Uint8Array` |
| `sampleRate` | `number`                 |

#### Returns

`Promise`<`string` \| `null`\>

#### Defined in

[server/asr.ts:112](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/asr.ts#L112)

### spokestackASRService

▸ **spokestackASRService**(`userConfig`, `onData`): `Promise`<`WebSocket`\>

A low-level utility for working with the Spokestack ASR service directly.
This should not be used most of the time. It is only for
custom, advanced integrations.
See `asr` for one-off ASR and `asrSocketServer` for ASR streaming using
a websocket server that can be added to any node server.

#### Parameters

| Name         | Type                                                                |
| :----------- | :------------------------------------------------------------------ |
| `userConfig` | `[SpokestackASRConfig](#SpokestackASRConfig)`                       |
| `onData`     | (`response`: `[SpokestackResponse](#SpokestackResponse)`) => `void` |

#### Returns

`Promise`<`WebSocket`\>

#### Defined in

[server/spokestackASRService.ts:82](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/spokestackASRService.ts#L82)

#### SpokestackResponse

##### error

• `Optional` **error**: `string`

When the status is "error", the error message is available here.

#### Defined in

[server/spokestackASRService.ts:56](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/spokestackASRService.ts#L56)

##### final

• **final**: `boolean`

The `final` key is used to indicate that
the highest confidence transcript for the utterance is sent.
However, this will only be set to true after
signaling to Spokestack ASR that no more audio data is incoming.
Signal this by sending an empty buffer (e.g. `socket.send(Buffer.from(''))`).
See the source for `asr` for an example.

#### Defined in

[server/spokestackASRService.ts:65](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/spokestackASRService.ts#L65)

##### hypotheses

• **hypotheses**: `ASRHypothesis`[]

This is a list of transcripts, each associated with their own
confidence level from 0 to 1.
It is an array to allow for the possibility of multiple
transcripts in the API, but is almost always a list of one.

#### Defined in

[server/spokestackASRService.ts:72](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/spokestackASRService.ts#L72)

##### status

• **status**: `"ok"` \| `"error"`

#### Defined in

[server/spokestackASRService.ts:54](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/spokestackASRService.ts#L54)

#### ASRHypothesis

##### confidence

• **confidence**: `number`

A number between 0 and 1 to indicate the
tensorflow confidence level for the given transcript.

#### Defined in

[server/spokestackASRService.ts:49](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/spokestackASRService.ts#L49)

##### transcript

• **transcript**: `string`

#### Defined in

[server/spokestackASRService.ts:50](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/spokestackASRService.ts#L50)

#### ASRFormat

• **LINEAR16** = `"PCM16LE"`

#### Defined in

[server/spokestackASRService.ts:5](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/spokestackASRService.ts#L5)

### encryptSecret

▸ **encryptSecret**(`body`, `secret`): `string`

This is a convenience method for properly authorizing
requests to the Spokestack graphql API.

**Note:** Do not to expose your key's secret on the client.
This should only be done on the server.

**See the example app for an example of how to include the keys using environment variables.**

#### Parameters

| Name     | Type     |
| :------- | :------- |
| `body`   | `string` |
| `secret` | `string` |

#### Returns

`string`

#### Defined in

[server/encryptSecret.ts:12](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/server/encryptSecret.ts#L12)

---

## Convenience functions for the client

These functions are available exports from `spokestack/client`.

### record

▸ **record**(`config?`): `Promise`<`AudioBuffer`\>

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

#### Parameters

| Name     | Type                            |
| :------- | :------------------------------ |
| `config` | `[RecordConfig](#RecordConfig)` |

#### Returns

`Promise`<`AudioBuffer`\>

#### Defined in

[client/record.ts:84](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/record.ts#L84)

#### RecordConfig

##### time

• `Optional` **time**: `number`

The total time to record. Default: 3

#### Defined in

[client/record.ts:12](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/record.ts#L12)

## Methods

##### onProgress

▸ `Optional` **onProgress**(`remaining`): `void`

A callback function to be called each second of recording.

#### Parameters

| Name        | Type     |
| :---------- | :------- |
| `remaining` | `number` |

#### Returns

`void`

#### Defined in

[client/record.ts:16](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/record.ts#L16)

##### onStart

▸ `Optional` **onStart**(): `void`

A callback function to be called when recording starts

#### Returns

`void`

#### Defined in

[client/record.ts:14](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/record.ts#L14)

### startStream

▸ **startStream**(`__namedParameters`): `Promise`<`WebSocket`, [`ProcessorReturnValue`]\>

Returns a function to start recording using a native WebSocket.
This assumes the socket is hosted on the current server.

```js
import { startStream } from 'spokestack/client'

// ...
try {
  const [ws] = await startStream({
    isPlaying: () => this.isPlaying
  })
  ws.addEventListener('open', () => console.log('Recording started'))
  ws.addEventListener('close', () => console.log('Recording stopped'))
  ws.addEventListener('message', (e) => console.log('Speech processed: ', e.data))
} catch (e) {
  console.error(e)
}
```

#### Parameters

| Name                | Type                 |
| :------------------ | :------------------- |
| `__namedParameters` | `StartStreamOptions` |

#### Returns

`Promise`<`WebSocket`, [`ProcessorReturnValue`]\>

#### Defined in

[client/recordStream.ts:43](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/recordStream.ts#L43)

### stopStream

▸ **stopStream**(): `void`

Stop the current recording stream if one exists.

```js
import { stopStream } from 'spokestack/client'
stopStream()
```

#### Returns

`void`

#### Defined in

[client/recordStream.ts:96](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/recordStream.ts#L96)

### convertFloat32ToInt16

▸ **convertFloat32ToInt16**(`fp32Samples`): `Int16Array`

A utility method to convert Float32Array audio
to an Int16Array to be passed directly to Speech APIs
such as Google Speech

```js
import { convertFloat32ToInt16, record } from 'spokestack/client'

const buffer = await record()
const file = new File([convertFloat32ToInt16(buffer.getChannelData(0))], 'recording.raw')
```

#### Parameters

| Name          | Type           |
| :------------ | :------------- |
| `fp32Samples` | `Float32Array` |

#### Returns

`Int16Array`

#### Defined in

[client/convertFloat32ToInt16.ts:16](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/convertFloat32ToInt16.ts#L16)

### startPipeline

▸ **startPipeline**(`config`): `Promise`<`SpeechPipeline`\>

Create and immediately start a SpeechPipeline to process user
speech using the specified configuration.

To simplify configuration, preset pipeline profiles are provided and
can be passed in the config object's `profile` key. See
[PipelineProfile](#PipelineProfile) for more details.

**NOTE: The speech pipeline (specifically tensorflow's webgl backend)
currently only works in Blink browsers
(Chrome, Edge, Opera, Vivaldi, Brave, and most Android browsers)
as it requires the use of the experimental
OffscreenCanvas API.**

First make sure to serve the web worker and tensorflow.js
from your node server at the expected locations.

For example, with express:

```ts
app.use(
  '/spokestack-web-worker.js',
  express.static(`./node_modules/spokestack/dist/spokestack-web-worker.min.js`)
)
```

```ts
// Starts a speech pipeline for wakeword processing.
try {
  await startPipeline({
    profile: PipelineProfile.Wakeword,
    baseUrls: { wakeword: 'https://s.spokestack.io/u/hgmYb/js' },
    onEvent: (event) => {
      switch (event.type) {
        case SpeechEventType.Activate:
          this.setState({ wakeword: { error: '', result: true } })
          break
        case SpeechEventType.Timeout:
          this.setState({ wakeword: { error: 'timeout' } })
          break
        case SpeechEventType.Error:
          console.error(event.error)
          break
      }
    }
  })
} catch (e) {
  console.error(e)
}
```

#### Parameters

| Name     | Type                                        |
| :------- | :------------------------------------------ |
| `config` | `PipelineConfig`](client.md#pipelineconfig) |

#### Returns

`Promise`<[`SpeechPipeline`\>

#### Defined in

[client/pipeline.ts:161](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/pipeline.ts#L161)

#### SpeechPipeline

Spokestack's speech pipeline comprises a voice activity detection (VAD)
component and a series of `stage`s that manage voice interaction.

Audio is processed off the main thread, currently via a
`ScriptProcessorNode` and web worker. Each chunk of audio samples is
passed to the worker along with an indication of speech activity, and
each of the stages processes it in order to, e.g., detect whether the user
said a wakeword or transcribe an occurrence of a keyword. See documentation
for the individual stages for more information on their purpose.

• **new SpeechPipeline**(`config`)

Create a new speech pipeline.

#### Parameters

| Name     | Type                   | Description                                                                                                                                                             |
| :------- | :--------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `config` | `SpeechPipelineConfig` | A SpeechPipelineConfig object describing basic pipeline configuration as well as options specific to certain stages (URLs to models, classes for keyword models, etc.). |

#### Defined in

[client/SpeechPipeline.ts:49](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/SpeechPipeline.ts#L49)

## Methods

▸ **start**(): `Promise`<`SpeechPipeline`](client.SpeechPipeline.md)\>

Start processing audio with the pipeline. If this is the first use of the
pipeline, the microphone permission will be requested from the user if
they have not already granted it.

#### Returns

`Promise`<[`SpeechPipeline`\>

#### Defined in

[client/SpeechPipeline.ts:85](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/SpeechPipeline.ts#L85)

▸ **stop**(): `void`

Stop the pipeline, destroying the internal audio processors and
relinquishing the microphone.

#### Returns

`void`

#### Defined in

[client/SpeechPipeline.ts:206](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/SpeechPipeline.ts#L206)

#### SpeechPipelineConfig

##### onEvent

• `Optional` **onEvent**: `PipelineEventHandler`

#### Defined in

[client/SpeechPipeline.ts:19](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/SpeechPipeline.ts#L19)

##### speechConfig

• **speechConfig**: `SpeechConfig`

#### Defined in

[client/SpeechPipeline.ts:16](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/SpeechPipeline.ts#L16)

##### stages

• **stages**: `Stage`[]

#### Defined in

[client/SpeechPipeline.ts:17](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/SpeechPipeline.ts#L17)

##### workerUrl

• `Optional` **workerUrl**: `string`

#### Defined in

[client/SpeechPipeline.ts:18](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/SpeechPipeline.ts#L18)

#### PipelineProfile

Preset profiles for use with startPipeline that include both
default configuration and lists of processing stages. Individual
stages may require additional configuration that cannot be provided
automatically, so see each stage for more details. The stages used
by each profile are as follows:

- **Keyword**: VadTrigger and KeywordRecognizer:
  actively listens for any user speech and delivers a transcript if
  a keyword is recognized.
- **Wakeword**: WakewordTrigger:
  listens passively until a wakeword is recognized, then activates the
  pipeline so that ASR can be performed.

• **Keyword** = `"KEYWORD"`

A profile that activates on voice activity and transcribes speech
using pretrained keyword recognizer models that support a limited
vocabulary.

#### Defined in

[client/pipeline.ts:30](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/pipeline.ts#L30)

• **Wakeword** = `"WAKEWORD"`

A profile that sends an `Activate` event when a wakeword is detected
by a set of pretrained wakeword models. Once that event is received,
subsequent audio should be sent to a speech recognizer for transcription.

#### Defined in

[client/pipeline.ts:36](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/pipeline.ts#L36)

#### SpeechEventType

• **Activate** = `"ACTIVATE"`

#### Defined in

[client/types.ts:83](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/types.ts#L83)

• **Deactivate** = `"DEACTIVATE"`

#### Defined in

[client/types.ts:84](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/types.ts#L84)

• **Error** = `"ERROR"`

#### Defined in

[client/types.ts:87](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/types.ts#L87)

• **Recognize** = `"RECOGNIZE"`

#### Defined in

[client/types.ts:86](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/types.ts#L86)

• **Timeout** = `"TIMEOUT"`

#### Defined in

[client/types.ts:85](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/types.ts#L85)

#### Stage

• **KeywordRecognizer** = `"keyword"`

#### Defined in

[client/types.ts:100](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/types.ts#L100)

• **VadTrigger** = `"vadTrigger"`

#### Defined in

[client/types.ts:98](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/types.ts#L98)

• **WakewordTrigger** = `"wakeword"`

#### Defined in

[client/types.ts:99](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/types.ts#L99)

### stopPipeline

▸ **stopPipeline**(): `void`

Stop the speech pipeline and relinquish its resources,
including the microphone.

```ts
stopPipeline()
```

#### Returns

`void`

#### Defined in

[client/pipeline.ts:195](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/pipeline.ts#L195)

### countdown

▸ **countdown**(`time`, `progress`, `complete`): `void`

Countdown a number of seconds.
This is used by record() to record a certain number of seconds.

#### Parameters

| Name       | Type                              | Description                                      |
| :--------- | :-------------------------------- | :----------------------------------------------- |
| `time`     | `number`                          | Number of seconds                                |
| `progress` | (`remaining`: `number`) => `void` | Callback for each second (includes first second) |
| `complete` | () => `void`                      | Callback for completion                          |

#### Returns

`void`

#### Defined in

[client/countdown.ts:8](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/countdown.ts#L8)

---

## Low-level processor functions

These are low-level functions if you need to work with your own audio processors, available from `spokestack/client`.

### startProcessor

▸ **startProcessor**(): `Promise`<`Error`] \| [`null`, [`ProcessorReturnValue`]\>

Underlying utility method for recording audio,
used by the `record` and `recordStream` methods.

While createScriptProcessor is deprecated, the replacement (AudioWorklet)
does not yet have broad support (currently only supported in Blink browsers).
See https://caniuse.com/#feat=mdn-api_audioworkletnode

We'll switch to AudioWorklet when it does.

#### Returns

`Promise`<`Error`] \| [`null`, [`ProcessorReturnValue`]\>

#### Defined in

[client/processor.ts:22](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/processor.ts#L22)

#### ProcessorReturnValue

##### context

• **context**: `AudioContext`

#### Defined in

[client/processor.ts:8](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/processor.ts#L8)

##### processor

• **processor**: `ScriptProcessorNode`

#### Defined in

[client/processor.ts:9](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/processor.ts#L9)

### stopProcessor

▸ **stopProcessor**(): `void`

Underlying utility method to stop the current processor
if it exists and disconnect the microphone.

#### Returns

`void`

#### Defined in

[client/processor.ts:53](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/processor.ts#L53)

### concatenateAudioBuffers

▸ **concatenateAudioBuffers**(`buffer1`, `buffer2`, `context`): `null` \| `AudioBuffer`

A utility method to concatenate two AudioBuffers

#### Parameters

| Name      | Type                    |
| :-------- | :---------------------- |
| `buffer1` | `null` \| `AudioBuffer` |
| `buffer2` | `null` \| `AudioBuffer` |
| `context` | `AudioContext`          |

#### Returns

`null` \| `AudioBuffer`

#### Defined in

[client/concatenateAudioBuffers.ts:4](https://github.com/spokestack/node-spokestack/blob/695e9b9/src/client/concatenateAudioBuffers.ts#L4)
