import {Router, Request, Response, NextFunction} from 'express';
import {getAll, getReview, querySearch, getAllTest} from '../utils/data_handler';
import {Reviews} from '../entity/Reviews';

type Sort = "ASC" | "DESC" | "";

const router = Router();

const handleQuery = (req: Request, res: Response, next: NextFunction) => {
    let query: string = req.query.query as string;
    if(!query || query === "") return res.status(404).json({error: "No query provided"}) // Front-end check for no search query (don't send request)
    if(query.substring(0,4).toLowerCase() === "the ") query = query.substring(4)
    req.body.query = query.trim().replace(/\s/g, '<->') + ":*";
    next();
}

/* Route: /reviews */

router.get('/search', handleQuery, async(req: Request, res: Response) => {
    const results: Reviews[] = await querySearch(req.body.query, req.headers.filter as Sort, parseInt(req.headers.skip as string));
    res.json(results)
})

router.get('/all', async(req: Request, res: Response) => {
    const reviews: Reviews[] = await getAll(req.headers.filter as Sort, parseInt(req.headers.skip as string));
    res.json(reviews)
})

router.get('/movie/:movie', async(req: Request, res: Response) => {
    const review: Reviews | undefined = await getReview(req.params.movie)
    res.json(review);
})

router.get('/test', async(req: Request, res: Response) => {
    const reviews: Reviews[] = await getAllTest();
    res.json(reviews)
})

export default router;