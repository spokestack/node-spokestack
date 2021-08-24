# with-next

This example is built on [Next.js](https://github.com/zeit/next.js).

It is a proof-of-concept using [Spokestack](../../) to demonstrate
searching a database with voice using ASR and reading off the first result with text-to-speech.

## Usage

This example is deployed publicly at https://demo.spokestack.io.

```bash
$ git clone git@github.com:spokestack/node-spokestack.git
$ cd node-spokestack
$ npm install
$ cd examples/with-next
$ cp .env.local.example. .env.local # Fill in your credentials here. See "Getting Spokestack Credentials" below.
$ npm install
$ npm run dev
```

Then visit http://localhost:3000 in your browser.

Visit http://localhost:3000/graphql to view introspection docs on the Spokestack GraphQL API for synthesizing text to speech.

See `server/index.ts` for example code using [Next.js][next] and [Express][express].

## Getting Spokestack Credentials

Getting Spokestack credentials is easy and free. Go to [spokestack.io](https://spokestack.io) and create an account. Create a token in the settings section, at [spokestack.io/account/settings#api](https://spokestack.io/account/settings#api). Note that you'll only be able to see the token secret once. If you accidentally leave the page, create another token.

Once you have a token, copy `.env.local.example` to `.env.local` and add your credentials to that file.

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
