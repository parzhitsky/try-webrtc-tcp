import http from 'node:http'
import fs from 'node:fs'

const clients = new Set()

http
  .createServer((req, res) => {
    if (req.url === '/') {
      // Serve the HTML application
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(fs.readFileSync('./index.html'))

    } else if (req.url === '/signaling') {
      // Establish a unidirectional Server-Sent Events (SSE) stream
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      })
      clients.add(res)
      req.on('close', () => clients.delete(res))

    } else if (req.url === '/message' && req.method === 'POST') {
      // Receive SDP offers/answers/ICE candidates and broadcast them
      let body = ''
      req.on('data', chunk => body += chunk)
      req.on('end', () => {
        for (const client of clients) {
          client.write(`data: ${body}\n\n`)
        }

        res.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok')
      })

    } else {
      res.writeHead(404).end('Not Found')
    }
  })
  .listen(3000, () => {
    console.log('Signaling server listening on http://localhost:3000')
  })
