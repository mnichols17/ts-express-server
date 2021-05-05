import { BaseEntity, Entity, Column, PrimaryColumn } from "typeorm";
import { redis_client } from "../utils/redis_client";

@Entity()
export class Review extends BaseEntity {
    @PrimaryColumn()
    id!: number;

    @PrimaryColumn()
    avgrank!: number;

    @Column()
    movie!: string;

    @Column()
    avgtotal!: number;

    @Column()
    jlrank!: number;

    @Column()
    jeff!: number;

    @Column()
    kjrank!: number;

    @Column()
    kenjac!: number;

    @Column()
    buttered!: boolean;

    @Column()
    director!: string;

    @Column()
    genre!: string;

    @Column()
    subgenre!: string;

    @Column()
    studiocompany!: string;

    @Column()
    universe!: string;

    // @Column()
    // subuniverse!: string;
    @Column()
    country!: string;

    @Column()
    character!: string;

    @Column()
    sport!: string;

    @Column()
    holiday!: string;

    @Column()
    year!: number;

    @Column()
    decade!: string;

    @Column("tsvector", {select: true})
    document_with_id: any;

    @Column()
    poster!: string;

    @Column()
    plot!: string;

    @Column()
    actors!: string;

    @Column()
    video_key!: string;

    @Column()
    runtime!: number;

    @Column()
    revenue!: string;

    @Column()
    oscar_winner!: boolean;

    @Column()
    oscars!: string;

    @Column()
    oscars_animated!: string;

    @Column()
    oscars_foreign!: string;

    @Column()
    oscars_director!: string;

    @Column()
    best_actor!: string;

    @Column()
    best_actress!: string;

    @Column()
    support_actor!: string;

    @Column()
    support_actress!: string;

    @Column()
    goldenglobes!: string;

    @Column()
    rt!: string;

    @Column()
    imdb!: string;

    @Column()
    metacritic!: string;
    
    @Column()
    itunes!: string;

    @Column()
    spotify!: string;

    listed: boolean = false;

    seen: boolean = false;
}