# with-next

This example is built on [next.js](https://github.com/zeit/next.js).

It is a proof-of-concept using [Spokestack](../../) to demonstrate
searching a database with voice using ASR and reading off the first result with text-to-speech.

## Usage

```bash
$ git clone git@github.com:spokestack/node-spokestack.git
$ cd node-spokestack/examples/with-next
$ npm install
$ npm run dev
```

Then visit http://localhost:3000 in your browser.

Visit http://localhost:3000/__graphiql to view introspection docs on the Spokestack GraphQL API for synthesizing text to speech.
