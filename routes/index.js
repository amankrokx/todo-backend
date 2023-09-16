// import app router for express
import bcrypt from 'bcrypt';
import express from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../database/index.js';

const router = express.Router();

// create all routes here

router.put('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body
        if (!email || !password || !name) 
            throw { code: 400, message: 'Missing required fields: username, password or name' }

        // email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

        // email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
        if (!user.uid)
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
        res.status(201).json({ token, message: 'User created successfully' })
    } catch (error) {
        console.log(error)
        res
            .status(error.code && error.code < 501 ? error.code : 500)
            .json({ message: error.message || 'Internal Server Error' })
    }
})

export default router;

