import {Router, Request, Response, NextFunction} from 'express';
import {getReviews, getReview, getRandom, getLanding} from '../utils/data_handler';
import {Review} from '../entity/Review';
import redis, { ClientOpts } from 'redis';

type Sort = "ASC" | "DESC";
type Ratings = "avg" | "jeff" | "kenjac";

const client = process.env.NODE_ENV === 'production'? redis.createClient(process.env.REDIS_URL as ClientOpts) : redis.createClient();
const router = Router();

const handleQuery = (req: Request, res: Response, next: NextFunction) => {
    let query: string = req.query.query as string;
    if(!query || query === "") return res.status(404).json({error: "No query provided"})
    if(query.substring(0,4).toLowerCase() === "the ") query = query.substring(4)
    req.body.query = query.trim().replace(/\s/g, '<->') + ":*";
    next();
}

/* Route: /reviews */

router.get('/landing', async(req: Request, res: Response) => {
    client.get('landing', async(err, result) => {
        if(result) {
            res.json(JSON.parse(result))
        }
        else {
            const results = await getLanding()
            client.setex('landing', 3600, JSON.stringify(results));
            res.json(results)
        }
    })
})

router.get('/search', handleQuery, async(req: Request, res: Response) => {
    const {sort, ratings, directors, genres, subgenres, studiocompanies, universes, subuniverses, 
        characters, sportholidays, years, decades, providers, awards, runtime, ratingrange} = req.headers;

    const results: (Review[] | number)[] = await getReviews(sort as Sort, ratings as Ratings, parseInt(req.headers.skip as string), parseInt(req.headers.page as string),
    directors as string, genres as string, subgenres as string, studiocompanies as string, universes as string, subuniverses as string, 
    characters as string, sportholidays as string, years as string, decades as string, providers as string, awards as string, runtime as string, ratingrange as string, req.body.query);

    res.json(results)
})

router.get('/all', async(req: Request, res: Response) => {
    const {sort, ratings, directors, genres, subgenres, studiocompanies, universes, subuniverses, 
        characters, sportholidays, years, decades, providers, awards, runtime, ratingrange} = req.headers;

    const reviews: (Review[] | number)[] = await getReviews(sort as Sort, ratings as Ratings,  parseInt(req.headers.skip as string), parseInt(req.headers.page as string),
    directors as string, genres as string, subgenres as string, studiocompanies as string, universes as string, subuniverses as string, 
    characters as string, sportholidays as string, years as string, decades as string, providers as string, awards as string, runtime as string, ratingrange as string);

    res.json(reviews)
})

router.get('/movie/:id', async(req: Request, res: Response) => {
    const id = req.params.id;
    client.get(id, async(err, result) => {
        if(result) {
            res.json(JSON.parse(result))
        }
        else {
            try{
                const review: any[] | undefined = await getReview(parseInt(id))
                client.setex(id, 600, JSON.stringify(review));
                res.json(review);
            } catch(e) {
                res.json([]);
            }
        }
    })
})

router.get('/random', async(req: Request, res: Response) => {
    const {genres, subgenres, decades, providers, ratingrange, runtime} = req.headers;
    const reviews: Review[] = await getRandom(genres as string, subgenres as string, decades as string, 
                            providers as string, ratingrange as string, parseInt(runtime as string));
    const index = (Math.floor(Math.random()*reviews.length) + 1)
    res.json(reviews[index-1])
})

export default router;