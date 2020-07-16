import {Router, Request, Response, NextFunction} from 'express';
import {getAll, getReview, querySearch} from '../utils/data_handler';

const router = Router();

const handleQuery = (req: Request, res: Response, next: NextFunction) => {
    //query = query.trim().replace(/\s/g, '<->') + ":*";
}

router.get('/search', async(req: Request, res: Response) => {
    if(!req.body.query) return res.status(404).json({error: "No query provided"})
    const results = await querySearch(req.body.query, req.body.sort);
    res.json(results.length !== 0 ? results : {msg: "No reviews found"})
})

router.get('/:title', async(req: Request, res: Response) => {
    const review = await getReview(req.params.title)
    res.json(review);
})

router.get('/', async(req: Request, res: Response) => {
    const reviews = await getAll(req.body.sort);
    res.json(reviews)
})

export default router;