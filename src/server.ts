import express from 'express'
import reviewsRouter from './routes/reviews'
import usersRouter from './routes/users'
import hqRouter from './routes/hq'
import 'reflect-metadata'
import { createConnection } from 'typeorm'
import cors from 'cors'
import cluster from 'cluster'
import redis, { ClientOpts } from 'redis'
import session from 'express-session'
import connectRedis from 'connect-redis'

const numCPUs = require('os').cpus().length
const client =
  process.env.NODE_ENV === 'production' ? redis.createClient(process.env.REDIS_URL as ClientOpts) : redis.createClient()
const RedisStore = connectRedis(session)

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`)

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`${worker.process.pid} died`)
  })
} else {
  createConnection()
    .then((connection) => {
      console.log('Database Connected on', process.pid)
      const app = express()
      const port = process.env.PORT || 5000

      client.flushall('ASYNC', () => {
        console.log('Flushing cache')
      })

      const whitelist =
        process.env.NODE_ENV !== 'production'
          ? ['http://10.0.0.12:3000', 'http://localhost:3000']
          : ['*', 'https://5f6adcf5a45deb82be940c86--mrdb.netlify.app', 'https://www.movierankings.net']

      const corsOptions = {
        credentials: true,
        origin: (origin: any, callback: any) => {
          if (whitelist.indexOf(origin) === -1) {
            return callback(new Error('INVALID ORIGIN'), false)
          }
          return callback(null, true)
        }
      }
      // :{
      //     credentials: true,
      //     origin: "https://www.movierankings.net"
      // }

      app.use(cors(corsOptions))
      app.use(express.json())

      app.set('trust proxy', 1)
      app.use(
        session({
          store: new RedisStore({
            // client: redis as any,
            client,
            prefix: 'sess:'
          }),
          name: 'session_id',
          secret: process.env.SESSION_SECRET,
          resave: false,
          saveUninitialized: false,
          cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
            sameSite: 'none'
            // domain: process.env.NODE_ENV === "production"? '.netlify.app' : ''
          }
        } as any)
      )

      app.use('/reviews', reviewsRouter)
      // app.use('/users', usersRouter)
      // app.use('/hq', hqRouter)

      app.listen(port, () => console.log(`Listening on ${port}`))
    })
    .catch((error) => console.log('ERROR', error))
}
