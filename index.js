import http from 'http';

const server = http.createServer((req, res) => {
    const param = req.url.split("/")[1]
    res.setHeader("Content-Type", "text/plain")
    res.end(`Hello ${param}`)
})

server.listen(3000, () => {
    console.log("Server is running on port 3000\n http://localhost:3000")
})