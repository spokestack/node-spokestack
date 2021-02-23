# with-next

This example is built on [Next.js](https://github.com/zeit/next.js).

It is a proof-of-concept using [Spokestack](../../) to demonstrate
searching a database with voice using ASR and reading off the first result with text-to-speech.

## Usage

See `server/index.ts` for example code using [Next.js][next] and [Express][express].

```bash
$ git clone git@github.com:spokestack/node-spokestack.git
$ cd node-spokestack
$ npm install
$ cd examples/with-next
$ npm install
$ npm run dev
```

Then visit http://localhost:3000 in your browser.

Visit http://localhost:3000/\_\_graphiql to view introspection docs on the Spokestack GraphQL API for synthesizing text to speech.

### Run example using Google ASR instead of Spokestack ASR

This command will run the server and use [Google Cloud Speech][google] instead of [Spokestack ASR][spokestack]

```bash
$ ASR_SERVICE=google npm run dev
```

Then visit http://localhost:3000 in your browser.

[next]: https://github.com/zeit/next.js
[express]: https://expressjs.com/
[google]: https://cloud.google.com/speech-to-text/
[spokestack]: https://www.spokestack.io/docs/concepts/asr
