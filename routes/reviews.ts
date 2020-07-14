import {Router} from 'express';
import {getData} from '../utils/getData';

const router = Router();

router.get('/:title', async(req, res) => {
    const review = await getData("SELECT * FROM reviews WHERE LOWER(title) = LOWER($1)", [req.params.title])
    
    if(review.length > 0) res.json(review[0])
    else res.status(400).json({error: "Review doesn't exist"})
})

router.get('/', async(req, res) => {
    const reviews = await getData("SELECT * FROM reviews")
    res.json(reviews)
})

module.exports = router;