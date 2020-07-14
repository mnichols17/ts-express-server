import express from 'express';
import reviewsRouter from './routes/reviews';
import 'reflect-metadata';
import {createConnection} from 'typeorm';

createConnection()
.then(connection => console.log("Database Connected"))
.catch(error => console.log(error))

const app = express();
const port = process.env.PORT || 5000;



app.use(express.json());
app.use('/reviews', reviewsRouter)

app.listen(port, () => console.log(`Listening on ${port}`));