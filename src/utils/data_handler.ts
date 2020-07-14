import 'reflect-metadata';
import {Reviews} from '../entity/Reviews';

export const getAll = async() => {
    return await Reviews.find();
}

export const getReview = async(title: string) => {
    return await Reviews.findOne({title});
}