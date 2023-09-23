import dotenv from 'dotenv';
import express from 'express';
import { expressjwt } from 'express-jwt';
import router from './routes/index.js';

dotenv.config()

const app = express()

// express static serve from /dist react app
app.use(express.static('dist'))

// cross origin
app.use((req, res, next) => {
    // if request type is options preflight
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    }
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Authorization, Accept')
    next()
})

app.use(express.json())

app.use(expressjwt({
    secret: process.env.JWT_SECRET,
    algorithms: ['HS256'],
    credentialsRequired: true,
    getToken: (req) => {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer')
            return req.headers.authorization.split(' ')[1]
        else if (req.query && req.query.token)
            return req.query.token
        return null
    },
    onExpired: (req, res) => res.status(401).json({ message: 'Token expired' }),
}).unless({ path: ['/api/login', '/api/register', '/', '/index.html'] }))

app.use('/api', router)

const port = parseInt(process.env.PORT) || 8080;

app.listen(port, () => {
    console.log('Example app listening on port http://localhost:' + port + ' ! ')
})