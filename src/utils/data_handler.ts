import 'reflect-metadata';
import {Reviews} from '../entity/Reviews';

type Sort = "ASC" | "DESC" | "";

export const querySearch = async(query: string, sort: Sort, count: number) => {
    return await Reviews.createQueryBuilder('reviews')
            .where(`document_with_id @@ to_tsquery('movies', (:query))`, {query})
            .orderBy(sort !== "" ? {"reviews.rank": sort} : {})
            .skip(30*count)
            .take(30)
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

export const getAll = async(sort: Sort, count: number) => {
    return await Reviews.createQueryBuilder('reviews')
            .orderBy(sort !== "" ? {"reviews.rank": sort} : {})
            .skip(30*count)
            .take(30)
            .getMany();
}

export const getAllTest = async() => {
    return await Reviews.find();
}

export const getReview = async(movie: string) => {
    return await Reviews.findOne({movie});
}