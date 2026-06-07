import { createServer } from 'http'
import { google } from 'googleapis'

const PORT = 8080
const REDIRECT_URI = `http://localhost:${PORT}`

const CLIENT_ID     = process.env.GMAIL_CLIENT_ID
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET

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
    console.log('\n✅ Success! Add these to your .env.local and Vercel env vars:\n')
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`)
    console.log('\nDone. You will not need to run this script again.')
    process.exit(0)
  } catch (err) {
    console.error('❌ Failed to exchange code:', err.message)
    process.exit(1)
  }
})

server.listen(PORT, () => {
  console.log(`\nWaiting for Google to redirect to http://localhost:${PORT} ...`)
})
