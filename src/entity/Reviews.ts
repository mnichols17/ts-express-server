import { BaseEntity, Entity, Column, PrimaryColumn} from "typeorm";

@Entity()
export class Reviews extends BaseEntity {
    @PrimaryColumn()
    rank!: number;

    @Column()
    movie!: string;

    @Column()
    total!: number;

    @Column()
    director!: string;

    @Column()
    genre!: string;

    @Column()
    subgenre!: string;

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

    @Column("tsvector", {select: true})
    document_with_id: any;
}