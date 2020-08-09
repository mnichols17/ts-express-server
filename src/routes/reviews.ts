import {Router, Request, Response, NextFunction} from 'express';
import {getReviews, getReview, getRandom, getLanding} from '../utils/data_handler';
import {Review} from '../entity/Review';

type Sort = "ASC" | "DESC"

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
    const lists: Review[][] = await getLanding();
    res.json(lists)
})

router.get('/search', handleQuery, async(req: Request, res: Response) => {
    const {directors, genres, subgenres, studiocompanies, universes, subuniverses, 
        characters, sportholidays, years, decades, providers, oscars, goldenglobes} = req.headers;

    const results: Review[] = await getReviews(req.headers.sort as Sort, parseInt(req.headers.skip as string), 
    directors as string, genres as string, subgenres as string, studiocompanies as string, universes as string, subuniverses as string, 
    characters as string, sportholidays as string, years as string, decades as string, providers as string, oscars as string, goldenglobes as string, req.body.query);

    res.json(results)
})

router.get('/all', async(req: Request, res: Response) => {
    const {directors, genres, subgenres, studiocompanies, universes, subuniverses, 
        characters, sportholidays, years, decades, providers, oscars, goldenglobes} = req.headers;

    const reviews: Review[] = await getReviews(req.headers.sort as Sort, parseInt(req.headers.skip as string), 
    directors as string, genres as string, subgenres as string, studiocompanies as string, universes as string, subuniverses as string, 
    characters as string, sportholidays as string, years as string, decades as string, providers as string, oscars as string, goldenglobes as string);

    res.json(reviews)
})

router.get('/movie/:rank', async(req: Request, res: Response) => {
    try{
        const review: any[] | undefined = await getReview(parseInt(req.params.rank))
        res.json(review);
    } catch(e) {
        res.json([]);
    }
})

router.get('/random', async(req: Request, res: Response) => {
    const {genres, decades, providers} = req.headers;
    const reviews: Review[] = await getRandom(genres as string, decades as string, providers as string);
    const index = (Math.floor(Math.random()*reviews.length) + 1)
    res.json(reviews[index-1])
})


export default router;