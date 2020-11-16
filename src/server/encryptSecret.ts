import crypto from 'crypto'

/**
 * This is a convenience method for properly authorizing
 * requests to the Spokestack graphql API.
 *
 * **Note:** Do not to expose your key's secret on the client.
 * This should only be done on the server.
 *
 * See <a href="https://github.com/spokestack/node-spokestack/blob/develop/src/server/expressMiddleware.ts">server/expressMiddleware.ts</a>
 * for example usage.
 */
export default function encryptSecret(body: string): string {
  if (!process.env.SS_API_CLIENT_SECRET) {
    throw new Error('SS_API_CLIENT_SECRET is not set in the environment.')
  }
  const hmac = crypto.createHmac('sha256', process.env.SS_API_CLIENT_SECRET)
  hmac.update(body)
  return hmac.digest('base64')
}
