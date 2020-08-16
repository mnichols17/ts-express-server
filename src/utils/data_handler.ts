import 'reflect-metadata';
import {Review} from '../entity/Review';
import {Streaming} from '../entity/Streaming';
// import {Avg} from '../entity/Avg';
// import JustWatch from 'justwatch-api';
//import axios from 'axios';
import { Brackets } from 'typeorm';

type Sort = "ASC" | "DESC";
type Ratings = "avg" | "jeff" | "kenjac";

export const getReviews = async(sort: Sort, ratings: Ratings, count: number, directors: string, genres: string, subgenres: string, studiocompanies: string, universes: string, subuniverses: string, characters: string, sportholidays: string, years: string, decades: string, providers: string, awards: string, searchquery?: string) => {
    let total = 'reviews.avgtotal';
    let rank = 'reviews.avgrank';
    let order = {};
   
    switch(ratings){
        case("jeff"):
            total = 'reviews.jeff';
            rank = 'reviews.jlrank';
            order = {'reviews.jlrank': sort};
            break;
        case('kenjac'):
            total = 'reviews.kenjac';
            rank = 'reviews.kjrank';
            order = {'reviews.kjrank': sort};
            break;
        default:
            order = {'reviews.avgrank': sort};
    }
    
    try {
        const query = Review.createQueryBuilder('reviews')
        .select([rank, 'reviews.movie', 'reviews.poster', total, 'reviews.id', 'reviews.buttered', 'reviews.oscars', 'reviews.goldenglobes'])
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
        if(awards.length) query.andWhere(new Brackets(qb => {
            qb.andWhere("reviews.oscars IN (:...oscars)", {oscars: awards.split('@')})
                .orWhere("reviews.goldenglobes IN (:...goldenglobes)", {goldenglobes: awards.split('@')})
        }))
        return await query.orderBy(order)
            .skip(30*count)
            .take(30)
            .getMany();
    } catch(e) {
        return [];
    }
}

export const getReview = async(id: number) => {
    const review = await Review.findOne({id});
    if(!review) return []
    const providers = await Streaming.find({review_id: review.id});
    return [review, providers];
}

export const getRandom = async(genres: string, subgenres: string, decades: string, providers: string, min: number) => {
    try{
        const query = Review.createQueryBuilder('reviews')
        .select(['reviews.avgrank', 'reviews.jlrank', 'reviews.kjrank', 'reviews.id', 'reviews.poster', 'reviews.movie', 'reviews.avgtotal', 'reviews.jeff', 'reviews.kenjac', 'reviews.buttered'])
        .leftJoin(Streaming, 's', 'reviews.id = s.review_id')
        .where("reviews.avgtotal BETWEEN :min AND 100", {min})
        if(genres.length) query.andWhere("reviews.genre IN (:...genres)", { genres: genres.split('@')})  
        if(subgenres.length) query.andWhere("reviews.subgenre IN (:...subgenres)", { subgenres: subgenres.split('@')})  
        if(providers.length) query.andWhere('s.provider_id IN (:...providers)', {providers: providers.split('@')})
        if(decades.length) query.andWhere("reviews.decade IN (:...decades)", {decades: decades.split('@')})
        return await query.getMany();
    } catch(e) {
        return [];
    }
}

const jeff = [59, 52, 208, 144, 478, 757, 786, 874, 1041, 1224]
const kenjac = [45, 188, 438, 617, 2505, 1349, 335, 284, 219, 1332, 1435, 291, 1114]

export const getLanding = async() => {
    const lists: Review[][] = [];
    for(let i = 0; i < 6; i++){
        const total = (i === 0 || i === 5) ? 'reviews.avgtotal' : i < 3? 'reviews.jeff' : 'reviews.kenjac';
        const rank = (i === 0 || i === 5) ? 'reviews.avgrank' : i < 3? 'reviews.jlrank' : 'reviews.kjrank';
        const query = Review.createQueryBuilder('reviews')
            .select([rank, total, 'reviews.movie', 'reviews.poster', 'reviews.id', 'reviews.buttered', 'reviews.oscars', 'reviews.goldenglobes'])
        if(i === 5) query.where('reviews.year = :year', {year: 2020})
        else if(i === 1 || i === 3) query.where('reviews.avgrank IN (:...ranks)', {ranks: i === 1? jeff:kenjac})
        query.orderBy((i === 0 || i === 5) ? {"reviews.avgrank": "ASC"} : i < 3? {"reviews.jlrank": "ASC"} : {"reviews.kjrank": "ASC"})
        if(i !== 3) query.take(10)
        lists[i] = await query.getMany();
    }
    return lists;
}