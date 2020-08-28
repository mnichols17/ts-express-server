import express from 'express';
import reviewsRouter from './routes/reviews';
import 'reflect-metadata';
import {createConnection} from 'typeorm';
import cors from 'cors';
import cluster from 'cluster';
import redis, { ClientOpts } from 'redis';

const numCPUs = require('os').cpus().length;
const client = process.env.NODE_ENV === 'production'? 
        redis.createClient(process.env.REDIS_URL as ClientOpts) 
        : redis.createClient();

if(cluster.isMaster) {
    console.log(`Master ${process.pid} is running`)

    for(let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`${worker.process.pid} died`)
    })
} else {
    createConnection()
    .then(connection => {
        console.log("Database Connected on", process.pid)
        const app = express();
        const port = process.env.PORT || 5000;

        client.flushall('ASYNC', () => {
            console.log("Flushing cache")
        });

        const whitelist = ["http://10.0.0.12:3000", "http://localhost:3000"]

        const corsOptions = process.env.NODE_ENV !== 'production'?
        {
            origin: (origin: any, callback:any) => {
                if(whitelist.indexOf(origin) === -1){
                    return callback(new Error('INVALID ORIGIN'), false)
                }
                return callback(null, true);
            }
        }
        :{ 
            origin: "https://www.movierankings.net"
        }

        app.use(cors(corsOptions))
        app.use(express.json());
        app.use('/reviews', reviewsRouter)

        app.listen(port, () => console.log(`Listening on ${port}`));
    })
    .catch(error => console.log("ERROR", error))
}