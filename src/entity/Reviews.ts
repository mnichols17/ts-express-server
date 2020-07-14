import { BaseEntity, Entity, Column, PrimaryColumn} from "typeorm";

@Entity()
export class Reviews extends BaseEntity {
    @PrimaryColumn()
    title!: string;

    @Column()
    genre!: string;

    @Column()
    director!: string;

    @Column()
    subgenre!: string;

    @Column()
    language!: string;

    @Column()
    rating!: number;
}