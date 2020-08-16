import { BaseEntity, Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class Review extends BaseEntity {
    @PrimaryColumn()
    id!: number;

    @Column()
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
    sportholiday!: string;

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
    oscars!: string;

    @Column()
    goldenglobes!: string;

    @Column()
    rt!: string;

    @Column()
    imdb!: string;

    @Column()
    metacritic!: string;
}