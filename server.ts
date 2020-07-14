import express from 'express';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use('/reviews', require('./routes/reviews.ts'))

app.listen(port, () => console.log(`Listening on ${port}`));