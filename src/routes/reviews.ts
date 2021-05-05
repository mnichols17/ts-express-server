import { Router, Request, Response, NextFunction } from 'express'
import {
  getReviews,
  getReview,
  getRandom,
  getLanding,
  getRandomHoliday,
  test,
  fillStreaming
} from '../utils/data_handler'
import { Review } from '../entity/Review'
import { Streaming } from '../entity/Streaming'
import { redis_client } from '../utils/redis_client'
import { listIds, idInList } from '../utils/user_lists'
import auth from '../middleware/auth'
import { Lists } from '../entity/Lists'
import { createTestAccount } from 'nodemailer'

type Ratings = 'avg' | 'jeff' | 'kenjac'

// const client = process.env.NODE_ENV === 'production'? redis.createClient(process.env.REDIS_URL as ClientOpts) : redis.createClient();
const router = Router()

const handleQuery = (req: Request, res: Response, next: NextFunction) => {
  let query: string = req.query.query as string
  if (!query || query === '') next()
  else {
    if (query.substring(0, 4).toLowerCase() === 'the ') query = query.substring(4)
    req.body.query = query.trim().replace(/\s/g, '<->') + ':*'
    next()
  }
}

/* Route: /reviews */

router.get('/landing', async (req: Request, res: Response) => {
  console.log('HITTING LANDING')
  const user_id = req.session && req.session.userId ? req.session.userId : false
  const redis_string = user_id ? `${user_id}-landing` : 'landing'

  redis_client.get(redis_string, async (err, result) => {
    if (result) {
      res.json(JSON.parse(result))
    } else {
      if (user_id) {
        listIds(user_id).then(async ({ user_watch, user_seen }: any) => {
          const d = (await getLanding()).map((li: Review[]) => idInList(li, user_watch, user_seen))
          redis_client.setex(redis_string, 3600, JSON.stringify(d))
          res.json(d)
        })
      } else {
        const results = await getLanding()
        redis_client.setex(redis_string, 3600, JSON.stringify(results))
        res.json(results)
      }
    }
  })
})

router.get('/search', handleQuery, async (req: Request, res: Response) => {
  const {
    sort,
    ratings,
    directors,
    genres,
    subgenres,
    studiocompanies,
    universes,
    country,
    characters,
    sportholidays,
    years,
    decades,
    providers,
    awards,
    runtime,
    ratingrange
  } = req.headers

  const reviews: (Review[] | number)[] = await getReviews(
    sort as string,
    ratings as Ratings,
    parseInt(req.headers.skip as string),
    parseInt(req.headers.page as string),
    directors as string,
    genres as string,
    subgenres as string,
    studiocompanies as string,
    universes as string,
    country as string,
    characters as string,
    sportholidays as string,
    years as string,
    decades as string,
    providers as string,
    awards as string,
    runtime as string,
    ratingrange as string,
    req.body.query
  )

  res.json(reviews)
})

router.get('/all', handleQuery, async (req: Request, res: Response) => {
  const {
    sort,
    ratings,
    directors,
    genres,
    subgenres,
    studiocompanies,
    universes,
    country,
    characters,
    sportholidays,
    years,
    decades,
    providers,
    awards,
    runtime,
    ratingrange
  } = req.headers

  const user_id = req.session && req.session.userId ? req.session.userId : false

  const reviews: (Review[] | number)[] = await getReviews(
    sort as string,
    ratings as Ratings,
    parseInt(req.headers.skip as string),
    parseInt(req.headers.page as string),
    directors as string,
    genres as string,
    subgenres as string,
    studiocompanies as string,
    universes as string,
    country as string,
    characters as string,
    sportholidays as string,
    years as string,
    decades as string,
    providers as string,
    awards as string,
    runtime as string,
    ratingrange as string,
    req.body.query
  )

  listIds(user_id)
    .then(async ({ user_watch, user_seen }: any) => {
      const newt = idInList(reviews[0] as Review[], user_watch, user_seen)
      res.json([newt, reviews[1]])
    })
    .catch((err) => res.json(reviews))
})

router.get('/movie/:id', async (req: Request, res: Response) => {
  const id = req.params.id
  const user_id = req.session && req.session.userId ? req.session.userId : false
  const redis_string = user_id ? `${user_id}-${id}` : id

  redis_client.get(redis_string, async (err, result) => {
    if (result) {
      res.json(JSON.parse(result))
    } else {
      try {
        const review: any[] | undefined = await getReview(parseInt(id), user_id)
        listIds(user_id)
          .then(async ({ user_watch, user_seen }: any) => {
            const newt = idInList([review[0]], user_watch, user_seen)
            const save_review = [...newt, review[1], review[2]]
            redis_client.setex(id, 600, JSON.stringify(save_review))
            res.json(save_review)
          })
          .catch((err) => {
            redis_client.setex(id, 600, JSON.stringify(review))
            res.json(review)
          })
      } catch (e) {
        res.json([])
      }
    }
  })
})

router.get('/random', async (req: Request, res: Response) => {
  const { genres, subgenres, decades, providers, ratingrange, runtime } = req.headers
  const results: (Review | Streaming[])[] = await getRandom(
    genres as string,
    subgenres as string,
    decades as string,
    providers as string,
    ratingrange as string,
    parseInt(runtime as string)
  )
  res.json(results)
})

router.get('/holiday', async (req: Request, res: Response) => {
  const results: (Review | Streaming[])[] = await getRandomHoliday()
  res.json(results)
})

router.get('/lists/:username', [auth, handleQuery], async (req: Request, res: Response) => {
  const {
    sort,
    ratings,
    directors,
    genres,
    subgenres,
    studiocompanies,
    universes,
    characters,
    sportholidays,
    years,
    decades,
    providers,
    awards,
    runtime,
    type,
    ratingrange
  } = req.headers

  const user_id = req.session && req.session.userId ? req.session.userId : false

  listIds(user_id)
    .then(async ({ user_watch, user_seen }: any) => {
      if (!(type === 'watch' ? user_watch : user_seen).length) throw 'NO LISTS'
      else {
        const reviews: (Review[] | number)[] = await getReviews(
          sort as string,
          ratings as Ratings,
          parseInt(req.headers.skip as string),
          parseInt(req.headers.page as string),
          directors as string,
          genres as string,
          subgenres as string,
          studiocompanies as string,
          universes as string,
          characters as string,
          sportholidays as string,
          years as string,
          decades as string,
          providers as string,
          awards as string,
          runtime as string,
          ratingrange as string,
          req.body.query,
          (type === 'watch' ? user_watch : user_seen).join('@')
        )

        const newt = idInList(reviews[0] as Review[], user_watch, user_seen)
        res.json([newt, reviews[1]])
      }
    })
    .catch((err) => res.json([[], 0]))
})

router.get('/test', async (req: Request, res: Response) => {
  // test()
  // fillStreaming()
  res.json({})
})

export default router
