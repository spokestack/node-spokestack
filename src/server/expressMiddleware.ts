import encryptSecret from './encryptSecret'
import fetch from 'node-fetch'
import { v4 as uuid } from 'uuid'
import type { Request, Response } from 'express'

/**
 * Express middleware for adding a proxy to the Spokestack GraphQL API.
 * A proxy is necessary to avoid exposing your Spokestack token secret on the client.
 * Once a graphql route is in place, your client
 * can use that with <a href="https://graphql.org/">GraphQL</a>.
 *
 * ```js
 * import { spokestackMiddleware } from 'spokestack'
 * import bodyParser from 'body-parser'
 * import express from 'express'
 *
 * const expressApp = express()
 *
 * expressApp.post('/graphql', bodyParser.json(), spokestackMiddleware())
 * ```
 *
 * This is also convenient for setting up <a href="https://github.com/graphql/graphiql">graphiql introspection</a>.
 * An example fetcher for graphiql on the client (browser only) might look like this:
 *
 * ```js
 * const graphQLFetcher = (graphQLParams) =>
 *   fetch('/graphql', {
 *     method: 'post',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(graphQLParams)
 *   })
 *     .then((response) => response.json())
 *     .catch((response) => response.text())
 * ```
 */
export default function spokestackMiddleware(): (req: Request, res: Response) => void {
  return function (req, res) {
    if (!process.env.SS_API_CLIENT_ID) {
      res.status(500)
      res.send('SS_API_CLIENT_ID is not set in the server environment.')
      return
    }
    if (!req.body || !req.body.query) {
      res.status(400)
      res.send('Parameter required: "query"')
      return
    }
    const body = JSON.stringify(req.body)
    const Authorization = `Spokestack ${process.env.SS_API_CLIENT_ID}:${encryptSecret(body)}`
    fetch('https://api.spokestack.io/v1', {
      method: 'POST',
      headers: {
        Authorization,
        'x-request-id': uuid(),
        'Content-Type': 'application/json',
        pragma: 'no-cache',
        'cache-control': 'no-cache'
      },
      body
    })
      .then((response) => {
        if (!response.ok) {
          throw response
        }
        return response.json()
      })
      .then((json) => res.json(json))
      .catch((error) => {
        console.error(error)
        res.status(500)
        res.send('Unknown error with graphql query. Check server logs.')
      })
  }
}
