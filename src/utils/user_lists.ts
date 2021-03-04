import {redis_client} from './redis_client';
import { Lists } from '../entity/Lists';
import { Review } from '../entity/Review';

export const listIds = (user_id: string) => new Promise((resolve, reject) => {
    if(!user_id) reject();

    const redis_string = `${user_id}-lists`;

    redis_client.get(redis_string, async(err, result) => {
        if(result) {
            resolve(JSON.parse(result))
        }
        else {
            var user_watch: any[] = [];
            var user_seen: any[] = [];

            user_watch = (await Lists.find({
                select: ['review_id'],
                where: {
                    type: "watch", 
                    user_id
                }
            })).map((list:Lists) => list.review_id);

            user_seen = (await Lists.find({
                select: ['review_id'],
                where: {
                    type: "seen", 
                    user_id
                }
            })).map((list:Lists) => list.review_id)

            const lists = {user_watch, user_seen}

            redis_client.setex(redis_string, 3600, JSON.stringify(lists));
            resolve(lists);
        }
    })
})

export const idInList = (li: Review[], user_watch: number[], user_seen: number[]) => {
    return li.map((review: Review) => (
        {
            ...review,
            listed: user_watch.includes(review.id),
            seen: user_seen.includes(review.id),
        }
    ))
}