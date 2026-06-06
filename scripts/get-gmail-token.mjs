/**
 * Run once locally to get your Gmail refresh token:
 *   node scripts/get-gmail-token.mjs
 *
 * Paste the CLIENT_ID and CLIENT_SECRET from the Google Cloud Console
 * OAuth2 credentials JSON before running.
 */

import { createInterface } from 'readline'
import { google } from 'googleapis'

const CLIENT_ID     = process.env.GMAIL_CLIENT_ID     ?? 'PASTE_CLIENT_ID_HERE'
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET ?? 'PASTE_CLIENT_SECRET_HERE'
const REDIRECT_URI  = 'urn:ietf:wg:oauth:2.0:oob'    // desktop app out-of-band

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
]

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent',
})

console.log('\n1. Open this URL in your browser (make sure you are signed in as benhaus@gmail.com):\n')
console.log(authUrl)
console.log('\n2. Authorize the app, then paste the code below:\n')

const rl = createInterface({ input: process.stdin, output: process.stdout })
rl.question('Code: ', async (code) => {
  rl.close()
  try {
    const { tokens } = await oauth2Client.getToken(code.trim())
    console.log('\n✅ Add these to your .env.local and Vercel env vars:\n')
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`)
    console.log('\nDone. You will not need to run this script again.')
  } catch (err) {
    console.error('❌ Failed to exchange code:', err.message)
  }
})
