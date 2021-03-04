import { BaseEntity, Entity, Column, PrimaryColumn, ManyToOne} from "typeorm";

@Entity()
export class Streaming extends BaseEntity {
    @Column()
    review_id!: number;

    @Column()
    url!: string;

    @PrimaryColumn()
    provider_id!: number;
}