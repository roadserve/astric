/**
 * Hostinger (shared hosting) compatible Next.js starter.
 *
 * Many shared hosting "Node.js app" setups (Passenger) expect a single entry file
 * and provide PORT via env. This file runs Next.js in production mode on that port.
 */
const http = require('http')
const next = require('next')

const port = parseInt(process.env.PORT, 10) || 3000
const hostname = process.env.HOSTNAME || '0.0.0.0'

const app = next({ dev: false, hostname, port })
const handle = app.getRequestHandler()

app
  .prepare()
  .then(() => {
    http
      .createServer((req, res) => handle(req, res))
      .listen(port, hostname, () => {
        // eslint-disable-next-line no-console
        console.log(`Next.js running on http://${hostname}:${port}`)
      })
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start Next.js server:', err)
    process.exit(1)
  })

