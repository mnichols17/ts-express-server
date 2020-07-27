import {Router, Request, Response, NextFunction} from 'express';
import {getReviews, getReview} from '../utils/data_handler';
import {Reviews} from '../entity/Reviews';

type Sort = "ASC" | "DESC" | "";

const router = Router();

const handleQuery = (req: Request, res: Response, next: NextFunction) => {
    let query: string = req.query.query as string;
    if(!query || query === "") return res.status(404).json({error: "No query provided"})
    if(query.substring(0,4).toLowerCase() === "the ") query = query.substring(4)
    req.body.query = query.trim().replace(/\s/g, '<->') + ":*";
    next();
}

/* Route: /reviews */

router.get('/search', handleQuery, async(req: Request, res: Response) => {
    const {directors, genres, subgenres, universes, subuniverses, characters, sportholidays, years, decades} = req.headers;
    const results: Reviews[] = await getReviews(req.headers.sort as Sort, parseInt(req.headers.skip as string), directors as string, genres as string, subgenres as string, universes as string, subuniverses as string, characters as string, sportholidays as string, years as string, decades as string, req.body.query);
    res.json(results)
})

router.get('/all', async(req: Request, res: Response) => {
    const {directors, genres, subgenres, universes, subuniverses, characters, sportholidays, years, decades} = req.headers;
    const reviews: Reviews[] = await getReviews(req.headers.sort as Sort, parseInt(req.headers.skip as string), directors as string, genres as string, subgenres as string, universes as string, subuniverses as string, characters as string, sportholidays as string, years as string, decades as string);
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

export default router;