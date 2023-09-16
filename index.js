import dotenv from 'dotenv';
import express from 'express';
import router from './routes/index.js';

dotenv.config();

const app = express()

app.use(express.json())

app.use('/api', router);

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log('Example app listening on port ' + port + '! ')
})