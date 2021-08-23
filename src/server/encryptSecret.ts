import crypto from 'crypto'

/**
 * This is a convenience method for properly authorizing
 * requests to the Spokestack graphql API.
 *
 * **Note:** Do not to expose your key's secret on the client.
 * This should only be done on the server.
 *
 * **See the example app for an example of how to include the keys using environment variables.**
 */
export default function encryptSecret(body: string, secret: string): string {
  if (!body) {
    throw new Error('body is required to encrypt the secret')
  }
  if (!secret) {
    throw new Error('secret is required')
  }
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(body)
  return hmac.digest('base64')
}
