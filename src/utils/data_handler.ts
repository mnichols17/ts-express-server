import 'reflect-metadata';
import {Reviews} from '../entity/Reviews';

export const querySearch = async(query: string) => {
    return await Reviews.createQueryBuilder('reviews')
            .where("document_with_id @@ to_tsquery(:query)", {query: query.replace(' ', '<->') + ":*"})
            .getMany();
}

export const getAll = async() => {
    return await Reviews.find();
}

export const getReview = async(title: string) => {
    return await Reviews.findOne({title});
}