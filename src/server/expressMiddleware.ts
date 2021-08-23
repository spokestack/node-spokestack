import type { Request, Response } from 'express'

import encryptSecret from './encryptSecret'
import fetch from 'node-fetch'
import { v4 as uuid } from 'uuid'

export interface SpokestackConfig {
  /**
   * clientID and clientSecret are required to use Spokestack's public API
   * These API keys are free and can be generated
   * in your spokestack.io account settings
   */
  clientId: string
  clientSecret: string
  /**
   * Set a different location for the Spokestack domain.
   * This is rarely needed.
   * Spokestack uses this internally to test integration.
   * Default: 'api.spokestack.io'
   */
  spokestackHostname?: string
}

/**
 * Express middleware for adding a proxy to the Spokestack GraphQL API.
 * A proxy is necessary to avoid exposing your Spokestack token secret on the client.
 * Once a graphql route is in place, your client
 * can use that with <a href="https://graphql.org/">GraphQL</a>.
 *
 * @example
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
export default function spokestackMiddleware(
  userConfig: SpokestackConfig
): (req: Request, res: Response) => void {
  const config: Required<SpokestackConfig> = {
    spokestackHostname: 'api.spokestack.io',
    ...userConfig
  }
  if (!config.clientId || !config.clientSecret) {
    throw new Error(
      'clientId and clientSecret are required config. Include them using environment variables then pass them to this function.'
    )
  }
  return function (req, res) {
    if (!req.body || !req.body.query) {
      res.status(400)
      res.send('Parameter required: "query"')
      return
    }
    const body = JSON.stringify(req.body)
    const Authorization = `Spokestack ${config.clientId}:${encryptSecret(
      body,
      config.clientSecret
    )}`
    const url = new URL(
      '/v1',
      `${config.spokestackHostname.indexOf('localhost') > -1 ? 'http' : 'https'}://${
        config.spokestackHostname
      }`
    )
    fetch(url.href, {
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
