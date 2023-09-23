// import app router for express
import bcrypt from 'bcrypt';
import express from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../database/index.js';

const router = express.Router();

// create all routes here
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.put('/register', async (req, res) => {
    try {
        const { email, password, name = "aman" } = req.body
        if (!email || !password || !name) 
            throw { code: 400, message: 'Missing required fields: username, password or name' }

        if (!emailRegex.test(email))
            throw { code: 400, message: 'Invalid email address' }
        if (password.length < 6) 
            throw { code: 400, message: 'Password must be at least 6 characters long' }
        if (name.length < 2)
            throw { code: 400, message: 'Name must be at least 2 characters long' }
        
        // hash password using bcrypt
        const hashedPassword = bcrypt.hashSync(password, parseInt(process.env.SALT_ROUNDS));
        
        // create user in database
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name
            }
        })

        // create a jwt token
        const token = jwt.sign({ 
                uid: user.uid,
                email: user.email,
                name: user.name
             },
             process.env.JWT_SECRET,
             { expiresIn: '1d' }
        )

        // send token to client
        res.status(201).json({ token, message: 'User created successfully' })
    } catch (error) {
        console.log(error)
        res
            .status(error.code && error.code < 501 ? error.code : 500)
            .json({ message: error.message || 'Internal Server Error' })
    }

    
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password ) 
            throw { code: 400, message: 'Missing required fields: username or password' }

        if (!emailRegex.test(email))
            throw { code: 400, message: 'Invalid email address' }
        if (password.length < 6) 
            throw { code: 400, message: 'Password must be at least 6 characters long' }
        
        // get user from database
        const user = await prisma.user.findUnique({
            where: {
                email
            }
        })

        // check if user exists
        if (!user || !user.uid)
            throw { code: 400, message: 'User does not exist' }

        // check if password is correct
        if (!bcrypt.compareSync(password, user.password))
            throw { code: 400, message: 'Incorrect password' }

        // create a jwt token
        const token = jwt.sign({ 
                uid: user.uid,
                email: user.email,
                name: user.name
             },
             process.env.JWT_SECRET,
             { expiresIn: '1d' }
        )

        // send token to client
        res.status(200).json({ token, message: 'User created successfully' })
    } catch (error) {
        console.log(error)
        res
            .status(error.code && error.code < 501 ? error.code : 500)
            .json({ message: error.message || 'Internal Server Error' })
    }
})

// create note
router.put('/todo', async (req, res) => {
    try {
        const { body, data = {}, at = new Date() } = req.body
        const { uid } = req.auth
        
        if (!body)
            throw { code: 400, message: 'Missing required fields: body' }

        if (data && typeof data !== 'object')
            throw { code: 400, message: 'Data must be an object' }

        const todo = await prisma.todos.create({
            data: {
                body,
                data,
                at: new Date(at),
                uid
            }
        })

        res.status(201).json({ todo, message: 'Todo created successfully' })
    } catch (error) {
        console.log(error)
        res
            .status(error.code && error.code < 501 ? error.code : 500)
            .json({ message: error.message || "Internal Server Error" })
    }
})

// get todo
router.get('/todo/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { uid } = req.auth

        if (!id)
            throw { code: 400, message: 'Missing required fields: id' }

        // check if todon exists with id and uid
        const todo = await prisma.todos.findFirst({
            where: {
                id,
                uid
            }
        })

        if (!todo)
            throw { code: 404, message: 'Todo does not exist' }

        res.status(200).json({ todo, message: 'Todo retrieved successfully' })
    } catch (error) {
                console.log(error)
                res
                    .status(error.code && error.code < 501 ? error.code : 500)
                    .json({ message: error.message || "Internal Server Error" })
    }

})

// get todos by date range
router.get('/todo/:from/:to/:skip/:take', async (req, res) => {
    try {
        // from and to are unix timestamps
        const { from, to, skip = 0, take = 10 } = req.params
        const { uid } = req.auth

        console.log(from, to, skip, take)
        if (!from || !to)
            throw { code: 400, message: 'Missing required fields: from or to' }

        // check if todon exists with id and uid
        const todos = await prisma.todos.findMany({
            where: {
                uid,
                at: {
                    gte: new Date(parseInt(from)),
                    lte: new Date(parseInt(to))
                }
            },
            orderBy: {
                at: 'asc'
            },
            skip: parseInt(skip),
            take: parseInt(take)
        })

        res.status(200).json({ todos, message: 'Todos retrieved successfully' })

    } catch (error) {
        console.log(error)
        res
            .status(error.code && error.code < 501 ? error.code : 500)
            .json({ message: error.message || "Internal Server Error" })
    }
})

router.delete('/todo/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { uid } = req.auth

        if (!id)
            throw { code: 400, message: 'Missing required fields: id' }

        // check if todon exists with id and uid
        const todo = await prisma.todos.deleteMany({
            where: {
                AND: {
                    id,
                    uid
                }
            }
        })

        if (!todo)
            throw { code: 404, message: 'Todo does not exist' }

        res.status(200).json({ todo, message: 'Todo deleted successfully' })

    } catch (error) {
        console.log(error)
        res
            .status(error.code && error.code < 501 ? error.code : 500)
            .json({ message: error.message || "Internal Server Error" })
    }
})

router.get('/weather/:lat/:lon', async (req, res) => {
    try {
        const { lat, lon } = req.params

        if (!lat || !lon)
            throw { code: 400, message: 'Missing required fields: lat or lon' }

        const weather = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}`)
            .then(res => res.json())

        res.status(200).json({ weather, message: 'Weather retrieved successfully' })
    } catch (error) {
        console.log(error)
        res
            .status(error.code && error.code < 501 ? error.code : 500)
            .json({ message: error.message || "Internal Server Error" })
    }
})
export default router;
