import 'reflect-metadata';
import {Reviews} from '../entity/Reviews';

type Sort = "ASC" | "DESC" | "";

export const getReviews = async(sort: Sort, count: number, genres: string, subgenres: string, universes: string, subuniverses: string, characters: string, sportholidays: string, searchquery?: string) => {
    try {
        const query = Reviews.createQueryBuilder('reviews')
        if(searchquery) query.where(`document_with_id @@ to_tsquery('movies', (:searchquery))`, {searchquery})
        if(genres.length) query.where("reviews.genre IN (:...genres)", { genres: genres.split('@')})
        if(subgenres.length) query.andWhere("reviews.subgenre IN (:...subgenres)", {subgenres: subgenres.split('@')})
        if(universes.length) query.andWhere("reviews.universe IN (:...universes)", {universes: universes.split('@')})
        if(subuniverses.length) query.andWhere("reviews.subuniverse IN (:...subuniverses)", {subuniverses: subuniverses.split('@')})
        if(characters.length) query.andWhere("reviews.character IN (:...characters)", {characters: characters.split('@')})
        if(sportholidays.length) query.andWhere("reviews.sportholiday IN (:...sportholidays)", {sportholidays: sportholidays.split('@')})
        return await query.orderBy(sort !== "" ? {"reviews.rank": sort} : {})
            .skip(30*count)
            .take(30)
            .getMany();
    } catch(e) {
        return [];
    }
}

export const getReview = async(rank: number) => {
    return await Reviews.findOne({rank});
}