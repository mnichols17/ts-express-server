import 'reflect-metadata';
import {Review} from '../entity/Review';
import {Streaming} from '../entity/Streaming';
import JustWatch from 'justwatch-api';

type Sort = "ASC" | "DESC"

export const getReviews = async(sort: Sort, count: number, directors: string, genres: string, subgenres: string, studiocompanies: string, universes: string, subuniverses: string, characters: string, sportholidays: string, years: string, decades: string, providers: string, oscars: string, goldenglobes: string, searchquery?: string) => {
    try {
        const query = Review.createQueryBuilder('reviews')
        .select(['reviews.rank', 'reviews.movie', 'reviews.poster', 'reviews.total', 'reviews.id'])
        if(providers.length) query.leftJoin(Streaming, 's', 'reviews.id = s.review_id')
        if(providers.length) query.where('s.provider_id IN (:...providers)', {providers: providers.split('@')})
        if(searchquery) query.andWhere(`document_with_id @@ to_tsquery('movie_no_stop', (:searchquery))`, {searchquery})
        if(directors.length) query.andWhere("reviews.director IN (:...directors)", { directors: directors.split('@')})
        if(genres.length) query.andWhere("reviews.genre IN (:...genres)", { genres: genres.split('@')})
        if(subgenres.length) query.andWhere("reviews.subgenre IN (:...subgenres)", {subgenres: subgenres.split('@')})
        if(studiocompanies.length) query.andWhere("reviews.studiocompany IN (:...studiocompanies)", {studiocompanies: studiocompanies.split('@')})
        if(universes.length) query.andWhere("reviews.universe IN (:...universes)", {universes: universes.split('@')})
        if(subuniverses.length) query.andWhere("reviews.subuniverse IN (:...subuniverses)", {subuniverses: subuniverses.split('@')})
        if(characters.length) query.andWhere("reviews.character IN (:...characters)", {characters: characters.split('@')})
        if(sportholidays.length) query.andWhere("reviews.sportholiday IN (:...sportholidays)", {sportholidays: sportholidays.split('@')})
        if(years.length) query.andWhere("reviews.year IN (:...years)", {years: years.split('@')})
        if(decades.length) query.andWhere("reviews.decade IN (:...decades)", {decades: decades.split('@')})
        if(oscars.length) query.andWhere("reviews.oscars IN (:...oscars)", {oscars: oscars.split('@')})
        if(goldenglobes.length) query.andWhere("reviews.goldenglobes IN (:...goldenglobes)", {goldenglobes: goldenglobes.split('@')})
        return await query.orderBy({"reviews.rank": sort})
            .skip(30*count)
            .take(30)
            .getMany();
    } catch(e) {
        return [];
    }
}

export const getReview = async(rank: number) => {
    const review = await Review.findOne({rank});
    if(!review) return []
    const providers = await Streaming.find({review_id: review.id});
    return [review, providers];
}

export const getRandom = async(genres: string, decades: string, providers: string) => {
    const query = Review.createQueryBuilder('reviews')
        .select(['reviews.rank', 'reviews.id', 'reviews.poster', 'reviews.movie', 'reviews.total'])
        .leftJoin(Streaming, 's', 'reviews.id = s.review_id')
    if(providers.length) query.where('s.provider_id IN (:...providers)', {providers: providers.split('@')})
    return await query.andWhere("reviews.genre IN (:...genres)", { genres: genres.split('@')})
                .andWhere("reviews.decade IN (:...decades)", {decades: decades.split('@')})
                .getMany();
}

const jeff = [54, 85, 134, 182, 219, 224, 262, 323, 439, 971]
const kenjac = [42, 45, 85, 109, 134, 122, 153, 219, 376, 520, 701, 726, 785, 882, 908, 953, 960, 1403, 2541, 2922]

export const getLanding = async() => {
    const lists: Review[][] = [];
    for(let i = 0; i < 4; i++){
        const query = Review.createQueryBuilder('reviews')
            .select(['reviews.rank', 'reviews.movie', 'reviews.poster', 'reviews.total', 'reviews.id'])
        if(i === 1) query.where('reviews.year = :year', {year: 2020})
        else if(i >= 2) query.where('reviews.rank IN (:...ranks)', {ranks: i === 2? jeff:kenjac})
        query.orderBy({"reviews.rank": "ASC"})
        if(i !== 3) query.take(10)
        lists[i] = await query.getMany();
    }
    return lists;
}