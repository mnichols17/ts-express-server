import {Router} from 'express';
import {getAll, getReview} from '../utils/data_handler';

const router = Router();

// router.get('/search/:query', async(req, res) => {
//     const reviews = await getData("SELECT * FROM reviews ")
//     res.json(reviews)
// })

router.get('/:title', async(req, res) => {
    const review = await getReview(req.params.title)
    res.json(review);
})

router.get('/', async(req, res) => {
    const reviews = await getAll();
    res.json(reviews)
})

export default router;