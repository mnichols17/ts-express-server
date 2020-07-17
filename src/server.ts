import express from 'express';
import reviewsRouter from './routes/reviews';
import 'reflect-metadata';
import {createConnection} from 'typeorm';
import cors from 'cors';

createConnection()
.then(connection => {
    console.log("Database Connected")
    const app = express();
    const port = process.env.PORT || 5000;

    // Might need for deployment
    // const corsOptions = {
    //     origin: "http://localhost:3000/",
    //     optionsSuccessStatus: 200
    // }

    app.use(cors());
    app.use(express.json());
    app.use('/reviews', reviewsRouter)

    app.listen(port, () => console.log(`Listening on ${port}`));
})
.catch(error => console.log("ERROR", error))