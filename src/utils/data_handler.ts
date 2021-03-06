import 'reflect-metadata'
import { Review } from '../entity/Review'
import { Streaming } from '../entity/Streaming'
import { Avg } from '../entity/Avg'
import JustWatch from 'justwatch-api'
import axios from 'axios'
import { Brackets, Not, In } from 'typeorm'

type Ratings = 'avg' | 'jeff' | 'kenjac'

export const getReviews = async (
  sort: string,
  ratings: Ratings,
  count: number,
  page: number,
  directors: string,
  genres: string,
  subgenres: string,
  studiocompanies: string,
  universes: string,
  country: string,
  characters: string,
  sportholidays: string,
  years: string,
  decades: string,
  providers: string,
  awards: string,
  runtime: string,
  ratingRange: string,
  searchquery?: string,
  list?: string
) => {
  let total = 'reviews.avgtotal'
  let rank = 'reviews.avgrank'
  let order = {}

  try {
    count = count + 4 * (page - 1)
    const range = ratingRange.split('@')
    const sortValues = sort.split('@')

    switch (ratings) {
      case 'jeff':
        total = 'reviews.jeff'
        rank = 'reviews.jlrank'
        order = { 'reviews.jlrank': sortValues[1] }
        break
      case 'kenjac':
        total = 'reviews.kenjac'
        rank = 'reviews.kjrank'
        order = { 'reviews.kjrank': sortValues[1] }
        break
      default:
        order = { 'reviews.avgrank': sortValues[1] }
    }

    let rangeQuery = `${total} BETWEEN :minRating AND :maxRating`

    const query = Review.createQueryBuilder('reviews')
      .select([
        rank,
        'reviews.movie',
        'reviews.poster',
        total,
        'reviews.id',
        'reviews.oscar_winner',
        'reviews.goldenglobes',
        'reviews.year'
      ])
      .where('reviews.runtime BETWEEN 10 AND :runtime', { runtime })
      .andWhere(
        new Brackets((qb) => {
          qb.where(rangeQuery, {
            minRating: range[0],
            maxRating: range[1]
          }).orWhere(`${total} IS NULL`)
        })
      )
    if (list) query.andWhere('reviews.id IN (:...ids)', { ids: list.split('@') })
    if (providers.length) query.leftJoin(Streaming, 's', 'reviews.id = s.review_id')
    if (providers.length)
      query.andWhere('s.provider_id IN (:...providers)', {
        providers: providers.split('@')
      })
    if (searchquery) query.andWhere(`document_with_id @@ to_tsquery('movie_no_stop', (:searchquery))`, { searchquery })
    if (directors.length)
      query.andWhere('reviews.director IN (:...directors)', {
        directors: directors.split('@')
      })
    if (genres.length)
      query.andWhere(
        new Brackets((qb) => {
          genres.split('@').forEach((g: string, index: number) => {
            const parameter = { ['g_' + index]: `%${g}%` }
            !index
              ? qb.where(`reviews.genre LIKE :g_${index}`, parameter)
              : qb.orWhere(`reviews.genre LIKE :g_${index}`, parameter)
          })
        })
      )
    if (subgenres.length)
      query.andWhere(
        new Brackets((qb) => {
          subgenres.split('@').forEach((sg: string, index: number) => {
            const parameter = { ['sg_' + index]: `%${sg}%` }
            !index
              ? qb.where(`reviews.subgenre LIKE :sg_${index}`, parameter)
              : qb.orWhere(`reviews.subgenre LIKE :sg_${index}`, parameter)
          })
        })
      )
    if (studiocompanies.length)
      query.andWhere(
        new Brackets((qb) => {
          studiocompanies.split('@').forEach((sc: string, index: number) => {
            const parameter = { ['sc_' + index]: `%${sc}%` }
            !index
              ? qb.where(`reviews.studiocompany LIKE :sc_${index}`, parameter)
              : qb.orWhere(`reviews.studiocompany LIKE :sc_${index}`, parameter)
          })
        })
      )
    if (universes.length)
      query.andWhere(
        new Brackets((qb) => {
          universes.split('@').forEach((u: string, index: number) => {
            const parameter = { ['u_' + index]: `%${u}%` }
            !index
              ? qb.where(`reviews.universe LIKE :u_${index}`, parameter)
              : qb.orWhere(`reviews.universe LIKE :u_${index}`, parameter)
          })
        })
      )
    if (country.length)
      query.andWhere(
        new Brackets((qb) => {
          country.split('@').forEach((c: string, index: number) => {
            const parameter = { ['c_' + index]: `%${c}%` }
            !index
              ? qb.where(`reviews.country LIKE :c_${index}`, parameter)
              : qb.orWhere(`reviews.country LIKE :c_${index}`, parameter)
          })
        })
      )
    if (characters.length)
      query.andWhere(
        new Brackets((qb) => {
          characters.split('@').forEach((c: string, index: number) => {
            const parameter = { ['c_' + index]: `%${c}%` }
            !index
              ? qb.where(`reviews.character LIKE :c_${index}`, parameter)
              : qb.orWhere(`reviews.character LIKE :c_${index}`, parameter)
          })
        })
      )
    if (sportholidays.length)
      query.andWhere(
        new Brackets((qb) => {
          qb.andWhere('reviews.sport IN (:...sports)', {
            sports: sportholidays.split('@')
          }).orWhere('reviews.holiday IN (:...holidays)', {
            holidays: sportholidays.split('@')
          })
        })
      )
    if (years.length) query.andWhere('reviews.year IN (:...years)', { years: years.split('@') })
    if (decades.length)
      query.andWhere('reviews.decade IN (:...decades)', {
        decades: decades.split('@')
      })
    if (awards.length)
      query.andWhere(
        new Brackets((qb) => {
          qb.andWhere('reviews.oscars IN (:...oscars)', {
            oscars: awards.split('@')
          })
            .orWhere('reviews.oscars_animated IN (:...oscars)', {
              oscars: awards.split('@')
            })
            .orWhere('reviews.goldenglobes IN (:...goldenglobes)', {
              goldenglobes: awards.split('@')
            })
        })
      )
    const resultsTotal = await query.getCount()
    const results = await query
      .orderBy(
        sortValues[0] === 'year'
          ? {
              'reviews.year': sortValues[1] as 'ASC' | 'DESC',
              'reviews.id': 'ASC'
            }
          : order
      )
      .skip(30 * count)
      .take(30)
      .getMany()
    return [results, resultsTotal]
  } catch (e) {
    console.log('GOT AN ERROR', e)
    return []
  }
}

export const getReview = async (id: number, user_id: string) => {
  const review = await Review.findOne({ id })
  if (!review) return []
  const { director, holiday, sport, character, universe, studiocompany, subgenre, genre, country } = review
  const cats: [string, string][] = [
    ['holiday', holiday],
    ['sport', sport],
    ['character', character],
    ['universe', universe],
    ['subgenre', subgenre],
    ['country', country],
    ['director', director],
    ['studiocompany', studiocompany],
    ['genre', genre]
  ]
  let similar: Review[] = []
  for (let i = 0; i < 7; i++) {
    if (cats[i][1] === null) continue
    const fill = await Review.find({
      select: ['avgrank', 'movie', 'poster', 'avgtotal', 'id', 'oscar_winner', 'goldenglobes'],
      where: {
        [cats[i][0]]: cats[i][1],
        id: Not(In([review.id, ...similar.map((s) => s.id)]))
      },
      take: 7
    })
    similar = [...similar, ...fill]
    if (similar.length >= 7) break
  }
  const providers = await Streaming.find({ review_id: review.id })
  return [review, providers, similar.slice(0, 7)]
}

export const getRandom = async (
  genres: string,
  subgenres: string,
  decades: string,
  providers: string,
  ratingRange: string,
  runtime: number
) => {
  try {
    const range = ratingRange.split('@')

    const query = Review.createQueryBuilder('reviews')
      .select([
        'reviews.avgrank',
        'reviews.jlrank',
        'reviews.kjrank',
        'reviews.id',
        'reviews.poster',
        'reviews.movie',
        'reviews.avgtotal',
        'reviews.jeff',
        'reviews.kenjac',
        'reviews.buttered'
      ])
      .leftJoin(Streaming, 's', 'reviews.id = s.review_id')
      .where('reviews.avgtotal BETWEEN :min AND :max', {
        min: range[0],
        max: range[1]
      })
      .andWhere('reviews.runtime BETWEEN 24 AND :runtime', {
        runtime: runtime || 229
      })
    if (genres.length)
      query.andWhere(
        new Brackets((qb) => {
          genres.split('@').forEach((g: string, index: number) => {
            const parameter = { ['g_' + index]: `%${g}%` }
            !index
              ? qb.where(`reviews.genre LIKE :g_${index}`, parameter)
              : qb.orWhere(`reviews.genre LIKE :g_${index}`, parameter)
          })
        })
      )
    if (subgenres.length)
      query.andWhere(
        new Brackets((qb) => {
          subgenres.split('@').forEach((sg: string, index: number) => {
            const parameter = { ['sg_' + index]: `%${sg}%` }
            !index
              ? qb.where(`reviews.subgenre LIKE :sg_${index}`, parameter)
              : qb.orWhere(`reviews.subgenre LIKE :sg_${index}`, parameter)
          })
        })
      )
    if (providers.length)
      query.andWhere('s.provider_id IN (:...providers)', {
        providers: providers.split('@')
      })
    if (decades.length)
      query.andWhere('reviews.decade IN (:...decades)', {
        decades: decades.split('@')
      })
    const reviews = await query.getMany()
    const index = Math.floor(Math.random() * reviews.length) + 1 - 1
    const streamingOptions = await Streaming.find({
      review_id: reviews[index].id
    })
    return [reviews[index], streamingOptions]
  } catch (e) {
    console.log('ERROR', e)
    return []
  }
}

const guest = [324857, 378, 2757, 2771, 23483, 460885, 451, 754, 2059, 9802]
const newest = [460465, 776515, 804435, 680319, 559581, 728118, 621954, 632357, 803923, 615678]
const jeff = [11524, 329865, 580175, 149, 371638, 14756, 49797, 463257, 70670, 11590]
const kenjac = [635302, 19908, 322, 9506, 1654, 577922, 9563, 106, 37724, 1725]

export const getLanding = async () => {
  const lists: Review[][] = []
  let cycle = 0
  for (let i = 0; i < 8; i++) {
    const total = !cycle ? 'reviews.avgtotal' : cycle === 1 ? 'reviews.jeff' : 'reviews.kenjac'
    const rank = !cycle ? 'reviews.avgrank' : cycle === 1 ? 'reviews.jlrank' : 'reviews.kjrank'

    const query = Review.createQueryBuilder('reviews').select([
      rank,
      total,
      'reviews.movie',
      'reviews.poster',
      'reviews.id',
      'reviews.buttered',
      'reviews.oscar_winner',
      'reviews.goldenglobes'
    ])
    if (i === 6) query.where('reviews.year = :year', { year: 2021 })
    else if (i === 7) query.where('reviews.id IN (:...ids)', { ids: guest })
    else if (i < 3)
      query.where('reviews.id IN (:...ids)', {
        ids: i === 0 ? newest : i === 1 ? jeff : kenjac
      })
    query.orderBy(
      !cycle ? { 'reviews.avgrank': 'ASC' } : cycle === 1 ? { 'reviews.jlrank': 'ASC' } : { 'reviews.kjrank': 'ASC' }
    )
    if (i !== 2) query.take(10)
    if (i === 7) lists.splice(3, 0, await query.getMany())
    else {
      lists[i] = await query.getMany()
    }
    if (i === 0) {
      const copy = [...lists[i]]
      copy.forEach((c: Review) => {
        const index = newest.indexOf(c.id)
        lists[i][index] = c
      })
    }
    cycle = (i + 1) % 3 === 0 || i === 6 ? 0 : cycle + 1
  }
  return lists
}

export const getRandomHoliday = async () => {
  try {
    const query = Review.createQueryBuilder('reviews')
      .select([
        'reviews.avgrank',
        'reviews.jlrank',
        'reviews.kjrank',
        'reviews.id',
        'reviews.poster',
        'reviews.movie',
        'reviews.avgtotal',
        'reviews.jeff',
        'reviews.kenjac',
        'reviews.buttered'
      ])
      .leftJoin(Streaming, 's', 'reviews.id = s.review_id')
      .andWhere(
        new Brackets((qb) => {
          qb.andWhere("reviews.holiday = 'Christmas'").orWhere('reviews.id IN (:...ids)', { ids: [13376, 2609] })
        })
      )
    const reviews = await query.getMany()
    const index = Math.floor(Math.random() * reviews.length) + 1 - 1
    const streamingOptions = await Streaming.find({
      review_id: reviews[index].id
    })
    return [reviews[index], streamingOptions]
  } catch (e) {
    console.log('HITTING ERROR', e)
    return []
  }
}

const p_ids: number[] = [
  10,
  2,
  3,
  192,
  9,
  352,
  350,
  78,
  289,
  258,
  358,
  337,
  34,
  105,
  331,
  257,
  123,
  384,
  27,
  212,
  15,
  238,
  191,
  8,
  386,
  387,
  207,
  37,
  43,
  215,
  363,
  73,
  322,
  31,
  99,
  191,
  7,
  531,
  332
]

const getStreaming = async (query: string, id: number) =>
  new Promise(async (resolve, reject) => {
    const justwatch = new JustWatch()
    const results = await justwatch.search({ query })

    await results.items.forEach(async (result: any) => {
      try {
        result.scoring.forEach(async (x: any) => {
          if (x.provider_type === 'tmdb:id' && x.value === id) {
            const pro_ids: { [key: number]: number } = {}
            const providers: object[] = []
            try {
              result.offers.forEach((o: any) => {
                if (!pro_ids[o.provider_id] && p_ids.includes(o.provider_id)) {
                  pro_ids[o.provider_id] = 1
                  if (!o.urls.standard_web) console.log(id, query)
                  providers.push({
                    review_id: id,
                    url: o.urls.standard_web,
                    provider_id: o.provider_id
                  })
                }
              })
              resolve(providers)
            } catch (e) {
              console.log('NO PROIVDERS', query, id)
            }
          }
        })
      } catch (e) {
        console.log(query, id)
      }
    })
    reject(results.items[0].scoring)
  })
export const fillStreaming = async () => {
  console.log('GRABBING STREAMING')
  let offset = 0
  const r = await Review.find()
  const toUse = r
  await toUse.forEach(async (t: any, idx) => {
    const { movie, id } = t
    setTimeout(async () => {
      if (idx === toUse.length - 1 || idx === toUse.length - 1) console.log('---- ALL DONE ----')
      await getStreaming(movie, id)
        .then(async (providers: any) => {
          providers.forEach(async (p: any) => {
            try {
              await Streaming.createQueryBuilder('streaming').insert().into(Streaming).values(p).execute()
            } catch (e) {
              null
            }
          })
        })
        .catch((err) => {
          console.log('ERROR', `{movie: "${movie}", id: ${id}},`, err)
        })
    }, 1000 + offset)
    offset += 1100
  })
  console.log(offset)
  return []
}

const different_titles: { [key: string]: string } = {
  'Star Wars: The Empire Strikes Back': 'Star Wars: Episode V - The Empire Strikes Back',
  'Star Wars: A New Hope': 'Star Wars: Episode IV - A New Hope',
  'Hunt For the Wilder People': 'Hunt For The Wilderpeople',
  'Kill Bill: Volume 2': 'Kill Bill: Vol. 2',
  'Kill Bill: Volume 1': 'Kill Bill: Vol. 1',
  'Star Wars: Force Awakens': 'Star Wars: Episode VII - The Force Awakens',
  'Star Wars: Return of the Jedi': 'Star Wars: Episode VI - Return of the Jedi',
  'Star Wars: The Last Jedi': 'Star Wars: Episode VIII - The Last Jedi',
  'Walk Hard: Dewey Cox Story': 'Walk Hard: The Dewey Cox Story',
  'Muppets Christmas Carol, The': 'Muppet Christmas Carol, The',
  'Lilo & Sitch': 'Lilo and Stitch',
  'Blair Witch Project, the': 'Blair Witch Project, The',
  'Talladega Nights: Ricky Bobby': 'Talladega Nights: The Ballad of Ricky Bobby',
  'Memoirs of Geisha': 'Memoirs of a Geisha',
  'Spy Who Loved Me, the': 'Spy Who Loved Me, The',
  'LEGO Movie 2: Second Part, The': 'LEGO Movie 2: The Second Part, The',
  'Max Max: Beyond Thunderdome': 'Mad Max: Beyond Thunderdome',
  'Hobbit: Desolation of Smaug, The': 'Hobbit: The Desolation of Smaug, The',
  'Star Wars: The Rise of Skywalker': 'Star Wars: Episode IX - The Rise of Skywalker',
  'Star Wars: Revenge of the Sith': 'Star Wars: Episode III - Revenge of the Sith',
  'Bling Ring, the': 'Bling Ring, The',
  'For a Good Time, Call…': 'For a Good Time, Call...',
  'Piranha 3-D': 'Piranha 3D',
  'Mission: Impossible 2': 'Mission: Impossible II',
  'Star Wars: Attack of the Clones': 'Star Wars: Episode II - Attack of the Clones',
  'Star Wars: The Phantom Menace': 'Star Wars: Episode I - The Phantom Menace',
  'Pokemon: The First Movie': 'Pokemon: The First Movie - Mewtwo Strikes Back',
  'Elizabeth: Golden Age': 'Elizabeth: The Golden Age',
  'Prince of Persia: Sands of Time': 'Prince of Persia: The Sands of Time',
  'Pokemon The Movie 2000': 'Pokemon: The Movie 2000',
  "Jacobs' Ladder": "Jacob's Ladder",
  'Texas Chainsaw': 'Texas Chainsaw 3D',
  'Fast & Furious Presents: Hobbs & Shaw': 'Fast and Furious Presents: Hobbs and Shaw',
  Seven: 'Seven (Se7en)',
  'Judgement Night': 'Judgment Night'
}

const lib: any = {}
const arr: number[] = []
const directors: [string, number][] = []
const s: string[] = []

const featured = [
  { value: 'Adam Sandler-verse', label: 'Adam Sandler-verse' },
  { value: 'Alien Universe', label: 'Alien Universe' },
  { value: 'Bourne Universe', label: 'Bourne Universe' },
  { value: 'Coen Brothers Universe', label: 'Coen Brothers Universe' },
  { value: 'Fast & Furious Universe', label: 'Fast & Furious Universe' },
  { value: 'James Bond Collection', label: 'James Bond Collection' },
  { value: 'Judd Apatow Universe', label: 'Judd Apatow Universe' },
  { value: 'Jurassic Park Franchise', label: 'Jurassic Park Franchise' },
  { value: 'Mission: Impossible Franchise', label: 'Mission: Impossible Franchise' },
  { value: 'Netflix Original', label: 'Netflix Original' },
  { value: "Ocean's Franchise", label: "Ocean's Franchise" },
  { value: 'Planet of the Apes Universe', label: 'Planet of the Apes Universe' },
  { value: 'Rocky Franchise', label: 'Rocky Franchise' },
  { value: 'Rocky Franchise', label: 'Rocky Franchise' },
  { value: 'Shrek Universe', label: 'Shrek Universe' },
  { value: 'Star Trek Universe', label: 'Star Trek Universe' },
  { value: 'Stephen King Universe', label: 'Stephen King Universe' },
  { value: 'Taylor Sheridan Universe', label: 'Taylor Sheridan Universe' },
  { value: 'Terminator Franchise', label: 'Terminator Franchise' },
  { value: 'Transformers Universe', label: 'Transformers Universe' },
  { value: 'Tyler Perry-verse', label: 'Tyler Perry-verse' }
]

const t_w_ids = [{ id: 635302, movie: 'Demon Slayer the Movie: Mugen Train', year: 2020 }]

const set_scores = [
  { id: 635302, movie: 'Demon Slayer the Movie: Mugen Train', year: 2020, rt: '95%', imdb: '8.4', metacritic: '82' }
]

export const test = async () => {
  refreshAvg()
}

const refreshAvg = async () => {
  const a = await Avg.find()
  let offset = 0
  a.forEach(async (newt: Avg) => {
    let {
      movie,
      year,
      avgtotal,
      avgrank,
      jeff,
      jlrank,
      kenjac,
      kjrank,
      buttered,
      genre,
      subgenre,
      studiocompany,
      universe,
      country,
      character,
      sport,
      oscars,
      goldenglobes,
      holiday,
      oscars_animated,
      oscars_foreign,
      oscars_director,
      best_actor,
      best_actress,
      support_actor,
      support_actress,
      rt,
      imdb,
      metacritic
    } = newt

    try {
      await Review.createQueryBuilder('review')
        .update(Review)
        .set({
          avgtotal,
          avgrank,
          jeff,
          jlrank,
          kenjac,
          kjrank,
          buttered,
          genre,
          subgenre,
          studiocompany,
          universe,
          country,
          character,
          sport,
          oscars,
          goldenglobes,
          holiday,
          oscars_animated,
          oscars_foreign,
          oscars_director,
          best_actor,
          best_actress,
          support_actor,
          support_actress
        })
        .where(movie === 'Alone' ? { movie, year, studiocompany } : { movie, year })
        .execute()
      offset += 1
    } catch (e) {
      console.log('ERR ON', movie, avgrank)
    }
  })
  console.log(offset, a.length)
}
