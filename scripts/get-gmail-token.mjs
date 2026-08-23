import { createServer } from 'http'
import { google } from 'googleapis'

const PORT = 8080
const REDIRECT_URI = `http://localhost:${PORT}`

const CLIENT_ID     = process.env.GMAIL_CLIENT_ID
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET

// modify already permits sending; gmail.send is listed so the grant is explicit
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
]

// The app must read and send as the shared MHAZ account, not a personal one
const EXPECTED_ACCOUNT = 'mhazapp@gmail.com'

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent',
})

console.log('\nOpening browser for authorization...')
console.log('If it does not open automatically, paste this URL into your browser:\n')
console.log(authUrl)

// Try to open browser automatically
const { exec } = await import('child_process')
exec(`open "${authUrl}"`)

// Start local server to capture the redirect
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const code = url.searchParams.get('code')

  if (!code) {
    res.end('No code received.')
    return
  }

  res.end('<h2>✅ Authorized! You can close this tab and return to the terminal.</h2>')
  server.close()

  try {
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Confirm which mailbox was actually authorized — signing in with the wrong
    // Google account is silent otherwise, and every alert would send from it.
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    const { data: profile } = await gmail.users.getProfile({ userId: 'me' })

    if (profile.emailAddress?.toLowerCase() !== EXPECTED_ACCOUNT) {
      console.error(`\n❌ Wrong account: authorized as ${profile.emailAddress}`)
      console.error(`   Expected ${EXPECTED_ACCOUNT}.`)
      console.error('   Sign out of that Google account (or use a fresh browser profile) and run this again.')
      console.error('   The token below was NOT saved anywhere — nothing has changed.')
      process.exit(1)
    }

    if (!tokens.refresh_token) {
      console.error('\n❌ Google did not return a refresh token. Re-run with prompt: consent.')
      process.exit(1)
    }

    console.log(`\n✅ Authorized as ${profile.emailAddress}`)
    console.log('\nAdd this to .env.local and your Vercel env vars:\n')
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Failed to exchange code:', err.message)
    process.exit(1)
  }
})

server.listen(PORT, () => {
  console.log(`\nWaiting for Google to redirect to http://localhost:${PORT} ...`)
})
