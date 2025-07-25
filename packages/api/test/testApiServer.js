const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.TEST_API_PORT || 3001

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`)
    let body = ''

    // Serve /test-image as a static endpoint for image testing
    if (parsedUrl.pathname === '/test-image' && req.method === 'GET') {
        const imagePath = path.join(__dirname, './pickle.jpeg')
        fs.readFile(imagePath, (err, data) => {
            if (err) {
                res.statusCode = 404
                res.end('Image not found')
            } else {
                res.statusCode = 200
                res.setHeader('Content-Type', 'image/png')
                res.end(data)
            }
        })
        return
    }

    // Serve /custom-404 for custom 404 error
    if (parsedUrl.pathname === '/custom-404') {
        res.statusCode = 404
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Custom Not Found', code: 404 }))
        return
    }
    // Serve /custom-500 for custom 500 error
    if (parsedUrl.pathname === '/custom-500') {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Custom Internal Server Error', code: 500 }))
        return
    }

    // Serve /plain-text for text response that fails JSON parsing
    if (parsedUrl.pathname === '/plain-text') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/plain')
        res.end('This is plain text response that cannot be parsed as JSON')
        return
    }

    // Serve /large-response for testing large response handling
    if (parsedUrl.pathname === '/large-response') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        const largeData = 'x'.repeat(10000) // Large string
        res.end(JSON.stringify({ data: largeData, size: 'large' }))
        return
    }

    // Serve /very-large-image for testing large image response handling
    if (parsedUrl.pathname === '/very-large-image') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'image/png')
        res.setHeader('Content-Length', '2000000') // 2MB
        const largeBuffer = Buffer.alloc(2000000, 'x') // 2MB buffer
        res.end(largeBuffer)
        return
    }

    // Serve /very-large-text for testing large text response handling
    if (parsedUrl.pathname === '/very-large-text') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/plain')
        res.setHeader('Content-Length', '1500000') // 1.5MB
        const largeText = 'This is a very large text response. '.repeat(40000) // Smaller but still large
        res.end(largeText)
        return
    }

    req.on('data', chunk => {
        body += chunk
    })

    req.on('end', () => {
        // Extract custom headers (non-standard headers)
        const customHeaders = {}
        for (const [key, value] of Object.entries(req.headers)) {
            if (!['host', 'connection', 'content-length', 'content-type', 'accept', 'user-agent'].includes(key)) {
                customHeaders[key] = value
            }
        }
        // Extract query parameters as 'params'
        const params = Object.fromEntries(parsedUrl.searchParams.entries())
        let response
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            // Echo back the request body as the response body, plus custom headers and params
            res.setHeader('Content-Type', req.headers['content-type'] || 'application/json')
            res.statusCode = 201
            try {
                const parsedBody = JSON.parse(body)
                response = JSON.stringify({ ...parsedBody, customHeaders, params })
            } catch {
                response = JSON.stringify({ body, customHeaders, params })
            }
        } else {
            // For GET and others, return a JSON with query and info, plus custom headers and params
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200
            response = JSON.stringify({
                method: req.method,
                url: parsedUrl.pathname,
                query: params,
                params,
                headers: req.headers,
                body,
                customHeaders
            })
        }
        res.end(response)
    })
})

server.listen(PORT, () => {
    console.log(`Test API server running at http://localhost:${PORT}`)
})
