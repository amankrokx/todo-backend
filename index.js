import dotenv from 'dotenv';
import express from 'express';
import { expressjwt } from 'express-jwt';
import router from './routes/index.js';

dotenv.config()

const app = express()

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
}).unless({ path: ['/api/login', '/api/register'] }))

app.use('/api', router)

const port = parseInt(process.env.PORT) || 8080;

app.listen(port, () => {
    console.log('Example app listening on port http://localhost:' + port + ' ! ')
})