import 'reflect-metadata';
import {Reviews} from '../entity/Reviews';

type Sort = "ASC" | "DESC" | false;

// Middlewar to handle query? (, The -> The, remove (2020))
export const querySearch = async(query: string, sort: Sort) => {
    query = query.trim().replace(/\s/g, '<->') + ":*";
    return await Reviews.createQueryBuilder('reviews')
            .where(`document_with_id @@ to_tsquery('movies', (:query))`, {query})
            .orderBy(sort ? {"reviews.rating": sort} : {})
            .getMany()
    // if(sort) {
    //     return await Reviews.createQueryBuilder('reviews')
    //         .where(`document_with_id @@ to_tsquery('movies', (:query))`, {query})
    //         .orderBy("reviews.rating", sort)
    //         .getMany()
    // } else {
    //     return await Reviews.createQueryBuilder('reviews')
    //         .where(`document_with_id @@ to_tsquery('movies', (:query))`, {query})
    //         .orderBy("")
    //         .getMany()
    // }
}

export const getAll = async(sort: Sort) => {
    return await Reviews.find();
}

export const getReview = async(title: string) => {
    return await Reviews.findOne({title});
}