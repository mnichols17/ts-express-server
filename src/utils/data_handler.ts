import 'reflect-metadata';
import {Reviews} from '../entity/Reviews';
import JustWatch from 'justwatch-api';

type Sort = "ASC" | "DESC" | "";

export const getReviews = async(sort: Sort, count: number, directors: string, genres: string, subgenres: string, universes: string, subuniverses: string, characters: string, sportholidays: string, years: string, decades: string, searchquery?: string) => {
    try {
        const query = Reviews.createQueryBuilder('reviews')
        .select(['reviews.rank', 'reviews.movie', 'reviews.poster', 'reviews.total'])
        if(searchquery) query.where(`document_with_id @@ to_tsquery('movie_no_stop', (:searchquery))`, {searchquery})
        if(directors.length) query.andWhere("reviews.director IN (:...directors)", { directors: directors.split('@')})
        if(genres.length) query.andWhere("reviews.genre IN (:...genres)", { genres: genres.split('@')})
        if(subgenres.length) query.andWhere("reviews.subgenre IN (:...subgenres)", {subgenres: subgenres.split('@')})
        if(universes.length) query.andWhere("reviews.universe IN (:...universes)", {universes: universes.split('@')})
        if(subuniverses.length) query.andWhere("reviews.subuniverse IN (:...subuniverses)", {subuniverses: subuniverses.split('@')})
        if(characters.length) query.andWhere("reviews.character IN (:...characters)", {characters: characters.split('@')})
        if(sportholidays.length) query.andWhere("reviews.sportholiday IN (:...sportholidays)", {sportholidays: sportholidays.split('@')})
        if(years.length) query.andWhere("reviews.year IN (:...years)", {years: years.split('@')})
        if(decades.length) query.andWhere("reviews.decade IN (:...decades)", {decades: decades.split('@')})
        return await query.orderBy(sort !== "" ? {"reviews.rank": sort} : {})
            .skip(30*count)
            .take(30)
            .getMany();
    } catch(e) {
        return [];
    }
}

export const getReview = async(rank: number) => {
    const review = await Reviews.findOne({rank});
    if(!review) return []
    const providers = await getStreaming(review.movie, parseInt(review.id));
    return [review, providers];
}
const p_ids:number[] = [10, 2, 3, 192, 9, 352, 350, 78, 289, 258, 358, 337, 34, 105, 
                            331, 257, 123, 384, 27, 212, 15, 238, 191, 8, 386, 387, 207, 
                            37, 43, 215, 363, 73, 322, 31]

const getStreaming = async(query: string, id: number) => {
    const justwatch = new JustWatch();
    const results = await justwatch.search({query})
    const providers: {[key:number]: string} = {}
    await results.items.forEach(async(result:any) => {
        result.scoring.forEach(async(x: any) => {
            if(x.provider_type === "tmdb:id" && x.value === id) {
                result.offers.forEach((o:any) => {
                    if(!providers[o.provider_id] && p_ids.includes(o.provider_id)) {
                        providers[o.provider_id] = o.urls.standard_web
                    }
                })
            }
        })
    })
    return providers;
}