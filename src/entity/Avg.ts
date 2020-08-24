import { BaseEntity, Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class Avg extends BaseEntity {
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

    @Column()
    subuniverse!: string;

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

    @Column()
    oscars!: string;

    @Column()
    goldenglobes!: string;

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
    itunes!: string;

    @Column()
    spotify!: string;

    // FROM TMDB
    @Column()
    runtime!: number;

    @Column()
    poster!: string;

    @Column()
    plot!: string;

    @Column()
    video_key!: string;

    @Column()
    actors!: string;

    @Column()
    rt!: string;

    @Column()
    imdb!: string;

    @Column()
    metacritic!: string;
}