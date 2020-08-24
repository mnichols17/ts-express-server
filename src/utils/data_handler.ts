import 'reflect-metadata';
import {Review} from '../entity/Review';
import {Streaming} from '../entity/Streaming';
// import {Avg} from '../entity/Avg';
// import JustWatch from 'justwatch-api';
// import axios from 'axios';
import { Brackets, Not, In } from 'typeorm';

type Sort = "ASC" | "DESC";
type Ratings = "avg" | "jeff" | "kenjac";

export const getReviews = async(sort: Sort, ratings: Ratings, count: number, page: number, directors: string, 
                                    genres: string, subgenres: string, studiocompanies: string, universes: string, 
                                    subuniverses: string, characters: string, sportholidays: string, years: string, 
                                    decades: string, providers: string, awards: string, runtime: string, ratingRange: string,
                                    searchquery?: string) => {

    let total = 'reviews.avgtotal';
    let rank = 'reviews.avgrank';
    let order = {};
   
    count = (count + (4 * (page-1)))

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

    let rangeQuery = `${total} BETWEEN :minRating AND :maxRating`
    const range = ratingRange.split('@')
    
    try {
        const query = Review.createQueryBuilder('reviews')
            .select([rank, 'reviews.movie', 'reviews.poster', total, 'reviews.id', 'reviews.oscar_winner', 'reviews.goldenglobes'])
            .where("reviews.runtime BETWEEN 15 AND :runtime", {runtime})
            .andWhere(rangeQuery, {minRating: range[0], maxRating: range[1]})
        if(providers.length) query.leftJoin(Streaming, 's', 'reviews.id = s.review_id')
        if(providers.length) query.andWhere('s.provider_id IN (:...providers)', {providers: providers.split('@')})
        if(searchquery) query.andWhere(`document_with_id @@ to_tsquery('movie_no_stop', (:searchquery))`, {searchquery})
        if(directors.length) query.andWhere("reviews.director IN (:...directors)", { directors: directors.split('@')})
        if(genres.length) query.andWhere("reviews.genre IN (:...genres)", { genres: genres.split('@')})
        if(subgenres.length) query.andWhere("reviews.subgenre IN (:...subgenres)", {subgenres: subgenres.split('@')})
        if(studiocompanies.length) query.andWhere("reviews.studiocompany IN (:...studiocompanies)", {studiocompanies: studiocompanies.split('@')})
        if(universes.length) query.andWhere("reviews.universe IN (:...universes)", {universes: universes.split('@')})
        if(subuniverses.length) query.andWhere("reviews.subuniverse IN (:...subuniverses)", {subuniverses: subuniverses.split('@')})
        if(characters.length) query.andWhere("reviews.character IN (:...characters)", {characters: characters.split('@')})
        if(sportholidays.length) query.andWhere(new Brackets(qb => {
            qb.andWhere("reviews.sport IN (:...sports)", {sports: sportholidays.split('@')})
                .orWhere("reviews.holiday IN (:...holidays)", {holidays: sportholidays.split('@')})
        }))
        if(years.length) query.andWhere("reviews.year IN (:...years)", {years: years.split('@')})
        if(decades.length) query.andWhere("reviews.decade IN (:...decades)", {decades: decades.split('@')})
        if(awards.length) query.andWhere(new Brackets(qb => {
            qb.andWhere("reviews.oscars IN (:...oscars)", {oscars: awards.split('@')})
                .orWhere("reviews.oscars_animated IN (:...oscars)", {oscars: awards.split('@')})
                // .orWhere("reviews.oscars_foreign IN (:...oscars)", {oscars: awards.split('@')})
                .orWhere("reviews.goldenglobes IN (:...goldenglobes)", {goldenglobes: awards.split('@')})
        }))
        const resultsTotal = await query.getCount();
        const results = await query.orderBy(order)
            .skip(30*count)
            .take(30)
            .getMany();
        return [results, resultsTotal];
    } catch(e) {
        return [];
    }
}

export const getReview = async(id: number) => {
    const review = await Review.findOne({id});
    if(!review) return []
    const {holiday, sport, character, subuniverse, universe, studiocompany, subgenre, genre} = review;
    const cats: [string, string][] = [['holiday', holiday], ['sport', sport], ['character', character], ['subuniverse', subuniverse], ['universe', universe], 
                                    ['subgenre', subgenre], ['studiocompany', studiocompany], ['genre', genre]];
    let similar: Review[] = [];
    for(let i = 0; i < 7; i++){
        if(cats[i][1] === null) continue;
        const fill = await Review.find({
            select: ["avgrank", "movie", "poster", "avgtotal", "id", "oscar_winner", "goldenglobes"],
            where:{
                [cats[i][0]]: cats[i][1],
                id: Not(In([review.id, ...similar.map(s => s.id)])),
            }, 
            take: 7
        })
        similar = [...similar, ...fill]
        if(similar.length >= 7) break;
    }
    const providers = await Streaming.find({review_id: review.id})
    return [review, providers, similar.slice(0, 7)];
}

export const getRandom = async(genres: string, subgenres: string, decades: string, providers: string, ratingRange: string, runtime: number) => {
    try{
        const range = ratingRange.split('@')

        const query = Review.createQueryBuilder('reviews')
        .select(['reviews.avgrank', 'reviews.jlrank', 'reviews.kjrank', 'reviews.id', 'reviews.poster', 'reviews.movie', 'reviews.avgtotal', 'reviews.jeff', 'reviews.kenjac', 'reviews.buttered'])
        .leftJoin(Streaming, 's', 'reviews.id = s.review_id')
        .where("reviews.avgtotal BETWEEN :min AND :max", {min: range[0], max: range[1]})
        .andWhere("reviews.runtime BETWEEN 63 AND :runtime", {runtime: runtime || 229})
        if(genres.length) query.andWhere("reviews.genre IN (:...genres)", { genres: genres.split('@')})  
        if(subgenres.length) query.andWhere("reviews.subgenre IN (:...subgenres)", { subgenres: subgenres.split('@')})  
        if(providers.length) query.andWhere('s.provider_id IN (:...providers)', {providers: providers.split('@')})
        if(decades.length) query.andWhere("reviews.decade IN (:...decades)", {decades: decades.split('@')})
        return await query.getMany();
    } catch(e) {
        return [];
    }
}

const newest = [605116, 531499, 628917, 587792, 516486, 547016, 706510, 592834, 595148];
const jeff = [10403, 2062, 1847, 592, 429200, 931, 351, 14756, 306947, 1878];
const kenjac = [465914, 583, 5503, 22947, 389015, 429200, 363088, 64689, 22803];

export const getLanding = async() => {
    const lists: Review[][] = [];
    let cycle = 0;
    for(let i = 0; i < 7; i++){
        const total = !cycle? 'reviews.avgtotal' : cycle === 1? 'reviews.jeff' : 'reviews.kenjac';
        const rank = !cycle? 'reviews.avgrank' : cycle === 1? 'reviews.jlrank' : 'reviews.kjrank';

        const query = Review.createQueryBuilder('reviews')
            .select([rank, total, 'reviews.movie', 'reviews.poster', 'reviews.id', 'reviews.buttered', 'reviews.oscar_winner', 'reviews.goldenglobes'])
        if(i === 6) query.where('reviews.year = :year', {year: 2020})
        else if(i < 3) query.where('reviews.id IN (:...ids)', {ids: i === 0? newest : i === 1? jeff:kenjac})
        query.orderBy(!cycle? {"reviews.avgrank": "ASC"} : cycle === 1? {"reviews.jlrank": "ASC"} : {"reviews.kjrank": "ASC"})
        if(i !== 2) query.take(10)
        lists[i] = await query.getMany();
        if(i === 0){
            const copy = [...lists[i]];
            copy.forEach((c:Review) => {
                const index = newest.indexOf(c.id);
                lists[i][index] = c;
            })
        }
        cycle = (i+1)%3 === 0? 0 : cycle + 1;
    }
    return lists;
}