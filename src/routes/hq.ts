import { Router, Request, Response, NextFunction } from 'express'
import axios from 'axios'
import { redis_client } from '../utils/redis_client'
import JustWatch from 'justwatch-api'

const router = Router()
const API_KEY = '50367d68b769a050f27d2115d98a2da0'
const missingPosterUrl = 'https://www.westernheights.k12.ok.us/wp-content/uploads/2020/01/No-Photo-Available.jpg'

const urls = [
  '?api_key=50367d68b769a050f27d2115d98a2da0&language=en-US',
  '/videos?api_key=50367d68b769a050f27d2115d98a2da0&language=en-US',
  '/credits?api_key=50367d68b769a050f27d2115d98a2da0',
]

const createRedisString = (id: any) => `ID - ${id}`

const makeRequest = (url: string, params: object) =>
  new Promise(async (resolve, reject) => {
    axios
      .get(url, { params })
      .then((res: any) => resolve(res.data))
      .catch((e: any) => reject({ error: e }))
  })

const getCredits = async (id: string) =>
  new Promise(async (resolve, reject) => {
    const params = {
      api_key: API_KEY,
      language: 'en-US',
    }

    makeRequest(`https://api.themoviedb.org/3/movie/${id}/credits`, params)
      .then((data: any) => {
        const directors = []
        const cast = []
        for (let i = 0; i < data.crew.length; i++) {
          if (data.crew[i].job === 'Director') directors.push(data.crew[i].name)
        }
        for (
          let i = 0;
          i < (data.cast.length > 8 ? 8 : data.cast.length);
          i++
        ) {
          cast.push(data.cast[i].name)
        }
        resolve({ cast, directors })
      })
      .catch((e: any) => reject({ error: e }))
  })

const getVideoKey = async (id: string) =>
  new Promise(async (resolve, reject) => {
    const params = {
      api_key: API_KEY,
      language: 'en-US',
    }

    makeRequest(`https://api.themoviedb.org/3/movie/${id}/videos`, params)
      .then((data: any) => {
        let q = 0
        let key = ''
        data.results.forEach((r: any) => {
          if (r.size > q && r.type === 'Trailer' && r.site === 'YouTube') {
            q = r.size
            key = r.key
          }
        })
        resolve(key)
      })
      .catch((e: any) => reject({ error: e }))
  })

router.get('/movies/new/search', async (req: Request, res: Response) => {
  console.log(req)
  const query = req.query.query
  console.log(`Searching for "${query}"`)

  const params = {
    api_key: API_KEY,
    language: 'en-US',
    query,
    page: 1,
    include_adult: false,
  }

  try {
    const { results }: any = await makeRequest(
      `https://api.themoviedb.org/3/search/movie`,
      params
    )
    const movies = results.map(
      ({ id, title, poster_path, release_date }: any) => ({
        id,
        title,
        thumbnail: poster_path? 'https://image.tmdb.org/t/p//w220_and_h330_face' + poster_path : missingPosterUrl,
        poster: poster_path? 'https://image.tmdb.org/t/p/w600_and_h900_bestv2' + poster_path : missingPosterUrl,
        year: release_date.split('-')[0],
      })
    )
    res.json({ movies })
  } catch (error) {
    res.json({ error })
  }
})

const getInfoFromTMDB = async(id: any) => {
  console.log(`Movie with id "${id}"`)

  const params = {
    api_key: API_KEY,
    language: 'en-US',
  }

  try {
    const [details, credits, video_key] = await Promise.all([
      makeRequest(`https://api.themoviedb.org/3/movie/${id}`, params),
      getCredits(id),
      getVideoKey(id),
    ])
    const {
      title,
      poster_path,
      release_date,
      overview,
      runtime,
      revenue,
    } = details as any
    const { directors, cast } = credits as any

    return({
      id,
      title,
      thumbnail: poster_path? 'https://image.tmdb.org/t/p//w220_and_h330_face' + poster_path : missingPosterUrl,
      poster: poster_path? 'https://image.tmdb.org/t/p/w600_and_h900_bestv2' + poster_path : missingPosterUrl,
      year: release_date.split('-')[0],
      plot: overview,
      runtime,
      revenue,
      directors,
      cast,
      video: `https://youtube.com/embed/${video_key}?autoplay=0`,
      jeff_rank: null,
      jeff_score: null,
      kenjac_rank: null,
      kenjac_score: null,
      average_rank: null,
      average_score: null,
    })
  } catch (error) {
    return error
  }
}

const p_ids: number[] = [
  10,
  2,
  3,
  192,
  9,
  352,
  350,
  78,
  289,
  258,
  358,
  337,
  34,
  105,
  331,
  257,
  123,
  384,
  27,
  212,
  15,
  238,
  191,
  8,
  386,
  387,
  207,
  37,
  43,
  215,
  363,
  73,
  322,
  31,
  99,
  191,
  7,
  531,
  332,
]

const getStreaming = async (id: number, query: string, ) =>
  new Promise(async (resolve, reject) => {
    const justwatch = new JustWatch()
    const results = await justwatch.search({ query })

    await results.items.forEach(async (result: any) => {
      try {
        result.scoring.forEach(async (x: any) => {
          if (x.provider_type === 'tmdb:id' && x.value === id) {
            const pro_ids: { [key: number]: number } = {}
            const providers: object[] = []
            try {
              result.offers.forEach((o: any) => {
                if (!pro_ids[o.provider_id] && p_ids.includes(o.provider_id)) {
                  pro_ids[o.provider_id] = 1
                  if (!o.urls.standard_web) console.log(id, query)
                  providers.push({
                    review_id: id,
                    url: o.urls.standard_web,
                    provider_id: o.provider_id,
                  })
                }
              })
              resolve(providers)
            } catch (e) {
              console.log('NO PROIVDERS', query, id)
            }
          }
        })
      } catch (e) {
        console.log(query, id)
      }
    })
    reject(results.items[0].scoring)
  })

const getProviders = async(id: any, title: any) => {
  let offset = 0
  return await getStreaming(id, title)
  // return providers
}

router.post('/movies', async (req: Request, res: Response) => {
  // const check CHECK IF MOVIE ALREADY EXISTS
  const {id, title} = req.body
  if(!id || !title) return res.status(400).json({created: false, error: `Missing id or title`})
  const redis_string = createRedisString(id)
  redis_client.get(redis_string, async (err, result) => {
    if (result) {
      res.status(400).json({created: false, error: `"${title}" is already in the database`})
    } else {
      try {
        console.log(`Created movie with ID: "${id}"`)
        const movie = await getInfoFromTMDB(id)
        const providers =  await getProviders(id, title)
        redis_client.setex(redis_string, 3600, JSON.stringify(movie))
        redis_client.setex(`providers - ${id}`, 3600, JSON.stringify(providers))
        res.json({ id, created: true })
      } catch (e) {
        res.status(400).json({error: `Something went wrong`})
      }
    }
  })
})

router.put('/movies/streaming', async (req: Request, res: Response) => {
  const {id, title} = req.body
  console.log(`Udpating streaming for movie with ID: "${id}"`)
  const providers = await getProviders(id, title)
  redis_client.setex(`providers - ${id}`, 3600, JSON.stringify(providers))
  res.json({providers})
})

router.get('/movies/:id', async (req: Request, res: Response) => {
  const {id} = req.params
  const redis_string = createRedisString(id)

  
  redis_client.get(redis_string, async (err, result: any) => {
    if (result) {
      console.log(`Getting movie with ID: "${id}"`)
      redis_client.get(`providers - ${id}`, async (e, r: any) => {
        const providers = JSON.parse(r) ?? []
        res.json(({...JSON.parse(result), providers}))
      })
    } else res.status(400).json({error: `No movie found`})
  })
})

router.put('/movies/:id', async (req: Request, res: Response) => {
  const {id} = req.params
  const data = req.body
  redis_client.setex(createRedisString(id), 3600, JSON.stringify(data))
  res.json(data)
})


export default router
