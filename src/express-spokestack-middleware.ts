import { Request, Response } from 'express'
import encryptSecret from './encryptSecret'
import { v4 as uuid } from 'uuid'

/**
 * Express middleware for adding a proxy to the Spokestack API
 */
export default function spokestackMiddleware(req: Request, res: Response) {
  if (!process.env.SS_API_URL) {
    res.status(500)
    res.send('SS_API_URL is not set in the server environment.')
    return
  }
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
  fetch(`${process.env.SS_API_URL}/v1`, {
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
