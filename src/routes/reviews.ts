import {Router, Request, Response, NextFunction} from 'express';
import {getAll, getReview, querySearch} from '../utils/data_handler';
import {Reviews} from '../entity/Reviews';

const router = Router();

const handleQuery = (req: Request, res: Response, next: NextFunction) => {
    let query: string = req.body.query_string;
    if(!query || query === "") return res.status(404).json({error: "No query provided"}) // Front-end check for no search query (don't send request)
    
    if(query.substring(0,4).toLowerCase() === "the ") query = query.substring(4)
    req.body.query = query.trim().replace(/\s/g, '<->') + ":*";
    next();
}

router.get('/search', handleQuery, async(req: Request, res: Response) => {
    const results: Reviews[] = await querySearch(req.body.query, req.body.sort);
    res.json(results.length !== 0 ? results : {msg: "No reviews found"})
})

router.get('/:title', async(req: Request, res: Response) => {
    const review: Reviews | undefined = await getReview(req.params.title)
    res.json(review);
})

router.get('/', async(req: Request, res: Response) => {
    const reviews: Reviews[] = await getAll(req.body.sort);
    res.json(reviews)
})

export default router;