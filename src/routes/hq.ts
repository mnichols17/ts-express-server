import {Router, Request, Response, NextFunction} from 'express';
import axios from 'axios';

const router = Router();
const API_KEY = '50367d68b769a050f27d2115d98a2da0'

const urls = [
    '?api_key=50367d68b769a050f27d2115d98a2da0&language=en-US',
    '/videos?api_key=50367d68b769a050f27d2115d98a2da0&language=en-US',
    '/credits?api_key=50367d68b769a050f27d2115d98a2da0'
]

const makeRequest = (url: string, params: object) => new Promise(async(resolve, reject) => {
    console.log(url, params)
    axios.get(url, {params})
    .then((res: any) => resolve(res.data))
    .catch((e: any) => reject({error: e}))
})

const getCredits = async(id: string) => new Promise(async(resolve, reject) => {
    const params = {
        api_key: API_KEY, 
        language: 'en-US',
    }

    makeRequest(`https://api.themoviedb.org/3/movie/${id}/credits`, params)
    .then((data: any) => {
        const directors = [];
        const cast = [];
        for(let i = 0; i < data.crew.length; i++){
            if(data.crew[i].job === 'Director') directors.push(data.crew[i].name)
        }
        for(let i = 0; i < (data.cast.length > 8? 8 : data.cast.length); i++){
            cast.push(data.cast[i].name)
        }
        resolve({cast, directors})
    })
    .catch((e: any) => reject({error: e}))
})

const getVideoKey = async(id: string) => new Promise(async(resolve, reject) => {
    const params = {
        api_key: API_KEY, 
        language: 'en-US',
    }

    makeRequest(`https://api.themoviedb.org/3/movie/${id}/videos`, params)
    .then((data: any) => {
        let q = 0;
        let key = '';
        data.results.forEach((r:any)=> {
            if(r.size > q && r.type === 'Trailer' && r.site === 'YouTube'){
                q = r.size;
                key = r.key;
            }
        })
        resolve(key)
    })
    .catch((e: any) => reject({error: e}))
})

router.get('/find/:query', async(req: Request, res: Response) => {
    const query = req.params.query;
    console.log(`Searching for "${query}"`)

    const params = {
        api_key: API_KEY, 
        language: 'en-US',
        query,
        page: 1,
        include_adult: false
    }

    try {
        const { results }: any = await makeRequest(`https://api.themoviedb.org/3/search/movie`, params)
        const movies = results.map(({id, title, poster_path, release_date}: any) => ({id, title, poster_path, year: release_date.split("-")[0]}))
        res.json({movies})
    } catch(error) {
        res.json({error})
    }
})

router.get('/tmdb/:id', async(req: Request, res: Response) => {
    const id = req.params.id;
    console.log(`Movie with id "${id}"`)

    const params = {
        api_key: API_KEY, 
        language: 'en-US',
    }

    try {
        const [details, credits, video_key] = await Promise.all([
            makeRequest(`https://api.themoviedb.org/3/movie/${id}`, params),
            getCredits(id),
            getVideoKey(id)
        ])
        const {title, poster_path, release_date, overview, runtime, revenue} = (details as any)
        const {directors, cast} = (credits as any)

        res.json({
            title, 
            poster_path, 
            year: release_date.split("-")[0], 
            plot: overview, 
            runtime, 
            revenue,
            directors,
            cast,
            video_key
        })
    } catch(error) {
        res.json({error})
    }
})

export default router;