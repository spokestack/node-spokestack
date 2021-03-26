![node-spokestack](./images/node-spokestack.png)

A set of tools for integration with the [Spokestack API](https://spokestack.io) in Node.js [![CircleCI](https://circleci.com/gh/spokestack/node-spokestack.svg?style=svg)](https://circleci.com/gh/spokestack/node-spokestack)

## Installation

```bash
$ npm install spokestack --save
```

## Features

Spokestack has all the tools you need to build amazing user experiences for speech. Here are some of the features included in node-spokestack:

- Automatic Speech Recognition (ASR): We provide multiple ways to hook up either [Spokestack ASR](https://www.spokestack.io/docs/concepts/asr) or [Google Cloud Speech](https://github.com/googleapis/nodejs-speech) to your node/express server, including asr functions for one-off ASR requests and websocket server integrations for ASR streaming. Or, use the ASR services directly for more advanced integrations.
- Speech-to-Text: Through the use of our [GraphQL](https://graphql.org) API (see below), Spokestack offers multiple ways to generate voice audio from text. Send raw text, [speech markdown](https://www.speechmarkdown.org), or [SSML](https://en.wikipedia.org/wiki/Speech_Synthesis_Markup_Language) and get back a URL for audio to play in the browser.
- Wake word and Keyword: Wake word and keyword processing are supported through the use of our speech pipeline (see [startPipeline](#startPipeline)). One of the most powerful features we provide is the ability to define and train custom wake word and keyword models directly on [spokestack.io](https://www.spokestack.io/account). When training is finished, we host the model files for you on a CDN. Pass the CDN URLs to `startPipeline()` and the Speech Pipeline will start listening These same models can be used in [spokestack-python](https://github.com/spokestack/spokestack-python), [spokestack-android](https://github.com/spokestack/spokestack-android), [spokestack-ios](https://github.com/spokestack/spokestack-ios), and [react-native-spokestack](https://github.com/spokestack/react-native-spokestack). The pipeline uses a web worker in the browser to keep all of the speech processing off the main thread so your UI never gets blocked. **NOTE: The speech pipeline (specifically tensorflow's webgl backend) currently only works in Blink browsers (Chrome, Edge, Opera, Vivaldi, Brave, and most Android browsers) as it requires the use of the experimental [OffscreenCanvas API](https://caniuse.com/?search=offscreencanvas). Firefox is close to full support for that API, and we'll look into supporting Firefox when that's available.**
- Natural Language Understanding (NLU): The [GraphQL](https://graphql.org) API (see below) also provides a way to convert the text from ASR to actionable "intents", or functions that apps can understand. For instance, if a user says, "Find a recipe for chocolate cake", an NLU might return a "SEARCH_RECIPE" intent. To use the NLU, you'll need an NLU model. While we have plans to release an NLU editor, the best way right now to create an NLU model is to use Alexa, DialogFlow, or Jovo and [upload the exported model to your Spokestack account](https://www.spokestack.io/docs/concepts/export). We support exports from all of those platforms.

**This repo includes [an example app](examples/with-next) that demonstrates ASR, speech-to-text, and wake word and keyword processing. It also includes a route for viewing live docs (or "introspection") of the Spokestack API (`/graphql`).**

## The GraphQL API

Speech-to-text and NLU are available through Spokestack's [GraphQL](https://graphql.org) API, which is available at `https://api.spokestack.io/v1`. It requires [Spokestack credentials](https://spokestack.io/create) to access (creating an account is quick and free).

To use the GraphQL API, node-spokestack includes [Express middleware](#spokestackmiddleware) to help integrate a proxy into any node/express server. A proxy is necessary to avoid exposing your Spokestack credentials.

The API is used to synthesize text-to-speech using various methods including raw text, [speech markdown](https://www.speechmarkdown.org), and [SSML](https://en.wikipedia.org/wiki/Speech_Synthesis_Markup_Language).

It can also be used for [NLU classification](https://www.spokestack.io/docs/concepts/nlu).

![Spokestack GraphQL Introspection](./spokestack-graphql.png)

## Automatic Speech Recognition (ASR)

ASR is accomplished through the use of a websocket (rather than GraphQL). node-spokestack includes functions to use either [Spokestack ASR](https://www.spokestack.io/docs/concepts/asr) or [Google Cloud Speech](https://github.com/googleapis/nodejs-speech), and there are two functions for each platform.

1. A [helper function](#asrSocketServer) for adding a websocket to a node server (express or otherwise). This is the main way to use ASR.
1. A [function](#asr) for processing speech into text in one-off requests. This is useful if you have all of the speech up-front.

### Using Google ASR instead of Spokestack ASR

If you'd prefer to use Google ASR, follow these [instructions for setting up Google Cloud Speech](https://github.com/googleapis/nodejs-speech#before-you-begin). Ensure `GOOGLE_APPLICATION_CREDENTIALS` is set in your environment, and then use the `googleASR` and `googleASRSocketServer` functions instead of their Spokestack equivalents.

## Wake Word and Keyword (Speech Pipeline)

The speech pipeline uses a custom build of [Tensorflow JS](https://github.com/tensorflow/tfjs) in a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) to process speech. It notifies the user when something matches the specified wake word or keyword models. The main function for this is the [`startPipeline()`](#startPipeline) function. To use `startPipeline()`, you'll need to serve the web worker and tensorflow from your node/express server. Our [example next.js app](examples/with-next) demonstrates how you might accomplish this in express:

```ts
app.use(
  '/spokestack-web-worker.js',
  express.static(`./node_modules/spokestack/dist/web-worker.min.js`)
)
app.use('/tensorflow.js', express.static(`./node_modules/spokestack/dist/tensorflow.min.js`))
```

With these made available to your front-end, the speech pipeline can be started.

## Setup

Go to [spokestack.io](https://spokestack.io) and create an account. Create a token at [spokestack.io/account/settings#api](https://spokestack.io/account/settings#api). Note that you'll only be able to see the token secret once. If you accidentally leave the page, create another token. Once you have a token, set the following environment variables in your `.bash_profile` or `.zshenv`:

```bash
export SS_API_CLIENT_ID=#"Identity" field from Spokestack API token
export SS_API_CLIENT_SECRET=#"Secret key" field from Spokestack API token
```

---

## Convenience functions for Node.js servers

### spokestackMiddleware

▸ **spokestackMiddleware**(): _function_

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

**Returns:** (`req`: Request, `res`: Response) => _void_

Defined in: [server/expressMiddleware.ts:37](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/server/expressMiddleware.ts#L37)

### asrSocketServer

▸ **asrSocketServer**(`serverConfig`: WebSocket.ServerOptions, `asrConfig?`: _Omit_<SpokestackASRConfig, _sampleRate_\>): _void_

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

| Name           | Type                                       |
| :------------- | :----------------------------------------- |
| `serverConfig` | WebSocket.ServerOptions                    |
| `asrConfig`    | _Omit_<SpokestackASRConfig, _sampleRate_\> |

**Returns:** _void_

Defined in: [server/socketServer.ts:23](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/server/socketServer.ts#L23)

### asr

▸ **asr**(`content`: _string_ \| Uint8Array, `sampleRate`: _number_): _Promise_<string \| _null_\>

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

| Name         | Type                   |
| :----------- | :--------------------- |
| `content`    | _string_ \| Uint8Array |
| `sampleRate` | _number_               |

**Returns:** _Promise_<string \| _null_\>

Defined in: [server/asr.ts:43](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/server/asr.ts#L43)

### googleASRSocketServer

▸ **googleASRSocketServer**(`serverConfig`: WebSocket.ServerOptions): _void_

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

| Name           | Type                    |
| :------------- | :---------------------- |
| `serverConfig` | WebSocket.ServerOptions |

**Returns:** _void_

Defined in: [server/socketServer.ts:108](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/server/socketServer.ts#L108)

### googleASR

▸ **googleASR**(`content`: _string_ \| Uint8Array, `sampleRate`: _number_): _Promise_<string \| _null_\>

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

| Name         | Type                   |
| :----------- | :--------------------- |
| `content`    | _string_ \| Uint8Array |
| `sampleRate` | _number_               |

**Returns:** _Promise_<string \| _null_\>

Defined in: [server/asr.ts:104](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/server/asr.ts#L104)

### encryptSecret

▸ **encryptSecret**(`body`: _string_): _string_

This is a convenience method for properly authorizing
requests to the Spokestack graphql API.

**Note:** Do not to expose your key's secret on the client.
This should only be done on the server.

See <a href="https://github.com/spokestack/node-spokestack/blob/develop/src/server/expressMiddleware.ts">server/expressMiddleware.ts</a>
for example usage.

#### Parameters:

| Name   | Type     |
| :----- | :------- |
| `body` | _string_ |

**Returns:** _string_

Defined in: [server/encryptSecret.ts:13](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/server/encryptSecret.ts#L13)

---

## Convenience functions for the client

These functions are available exports from `spokestack/client`.

### record

▸ **record**(`config?`: _[RecordConfig](#RecordConfig)_): _Promise_<AudioBuffer\>

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

| Name     | Type                            |
| :------- | :------------------------------ |
| `config` | _[RecordConfig](#RecordConfig)_ |

**Returns:** _Promise_<AudioBuffer\>

Defined in: [client/record.ts:84](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/client/record.ts#L84)

#### [RecordConfig](#RecordConfig)

##### onProgress

• `Optional` **onProgress**: (`remaining`: _number_) => _void_

A callback function to be called each second of recording.

#### Parameters:

| Name        | Type     |
| :---------- | :------- |
| `remaining` | _number_ |

**Returns:** _void_

Defined in: [client/record.ts:16](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/client/record.ts#L16)

##### onStart

• `Optional` **onStart**: () => _void_

A callback function to be called when recording starts

**Returns:** _void_

Defined in: [client/record.ts:14](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/client/record.ts#L14)

##### time

• `Optional` **time**: _number_

The total time to record. Default: 3

Defined in: [client/record.ts:12](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/client/record.ts#L12)

### startStream

▸ **startStream**(`__namedParameters`: StartStreamOptions): _Promise_<WebSocket, [*ProcessorReturnValue*]\>

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

#### Parameters:

| Name                | Type               |
| :------------------ | :----------------- |
| `__namedParameters` | StartStreamOptions |

**Returns:** _Promise_<WebSocket, [*ProcessorReturnValue*]\>

Defined in: [client/recordStream.ts:43](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/client/recordStream.ts#L43)

### stopStream

▸ **stopStream**(): _void_

Stop the current recording stream if one exists.

```js
import { stopStream } from 'spokestack/client'
stopStream()
```

**Returns:** _void_

Defined in: [client/recordStream.ts:96](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/client/recordStream.ts#L96)

### convertFloat32ToInt16

▸ **convertFloat32ToInt16**(`fp32Samples`: Float32Array): _Int16Array_

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
| :------------ | :----------- |
| `fp32Samples` | Float32Array |

**Returns:** _Int16Array_

Defined in: [client/convertFloat32ToInt16.ts:16](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/client/convertFloat32ToInt16.ts#L16)

### startPipeline

▸ **startPipeline**(`config`: _PipelineConfig_): _Promise_<SpeechPipeline\>

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
  express.static(`./node_modules/spokestack/dist/web-worker.min.js`)
)
app.use('/tensorflow.js', express.static(`./node_modules/spokestack/dist/tensorflow.min.js`))
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

#### Parameters:

| Name     | Type             |
| :------- | :--------------- |
| `config` | _PipelineConfig_ |

**Returns:** _Promise_<SpeechPipeline\>

Defined in: [client/pipeline.ts:165](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/client/pipeline.ts#L165)

### stopPipeline

▸ **stopPipeline**(): _void_

Stop the speech pipeline and relinquish its resources,
including the microphone.

```ts
stopPipeline()
```

**Returns:** _void_

Defined in: [client/pipeline.ts:199](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/client/pipeline.ts#L199)

### countdown

▸ **countdown**(`time`: _number_, `progress`: (`remaining`: _number_) => _void_, `complete`: () => _void_): _void_

Countdown a number of seconds.
This is used by record() to record a certain number of seconds.

#### Parameters:

| Name       | Type                              | Description                                      |
| :--------- | :-------------------------------- | :----------------------------------------------- |
| `time`     | _number_                          | Number of seconds                                |
| `progress` | (`remaining`: _number_) => _void_ | Callback for each second (includes first second) |
| `complete` | () => _void_                      | Callback for completion                          |

**Returns:** _void_

Defined in: [client/countdown.ts:8](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/client/countdown.ts#L8)

---

## Low-level processor functions

These are low-level functions if you need to work with your own audio processors, available from `spokestack/client`.

### startProcessor

▸ **startProcessor**(): _Promise_<Error] \| [_null_, [*ProcessorReturnValue*]\>

Underlying utility method for recording audio,
used by the `record` and `recordStream` methods.

While createScriptProcessor is deprecated, the replacement (AudioWorklet)
does not yet have broad support (currently only supported in Blink browsers).
See https://caniuse.com/#feat=mdn-api_audioworkletnode

We'll switch to AudioWorklet when it does.

**Returns:** _Promise_<Error] \| [_null_, [*ProcessorReturnValue*]\>

Defined in: [client/processor.ts:22](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/client/processor.ts#L22)

#### ProcessorReturnValue

##### context

• **context**: AudioContext

Defined in: [client/processor.ts:8](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/client/processor.ts#L8)

##### processor

• **processor**: ScriptProcessorNode

Defined in: [client/processor.ts:9](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/client/processor.ts#L9)

### stopProcessor

▸ **stopProcessor**(): _void_

Underlying utility method to stop the current processor
if it exists and disconnect the microphone.

**Returns:** _void_

Defined in: [client/processor.ts:50](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/client/processor.ts#L50)

### concatenateAudioBuffers

▸ **concatenateAudioBuffers**(`buffer1`: AudioBuffer \| _null_, `buffer2`: AudioBuffer \| _null_, `context`: AudioContext): _null_ \| AudioBuffer

A utility method to concatenate two AudioBuffers

#### Parameters:

| Name      | Type                  |
| :-------- | :-------------------- |
| `buffer1` | AudioBuffer \| _null_ |
| `buffer2` | AudioBuffer \| _null_ |
| `context` | AudioContext          |

**Returns:** _null_ \| AudioBuffer

Defined in: [client/concatenateAudioBuffers.ts:4](https://github.com/spokestack/node-spokestack/blob/63b2a9c/src/client/concatenateAudioBuffers.ts#L4)
