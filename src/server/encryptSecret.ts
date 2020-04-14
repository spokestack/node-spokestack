import crypto from 'crypto'

export default function encryptSecret(body: string) {
  if (!process.env.SS_API_CLIENT_SECRET) {
    throw new Error('SS_API_CLIENT_SECRET is not set in the environment.')
  }
  const hmac = crypto.createHmac('sha256', process.env.SS_API_CLIENT_SECRET)
  hmac.update(body)
  return hmac.digest('base64')
}
