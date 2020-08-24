import { BaseEntity, Entity, Column, PrimaryColumn, ManyToOne} from "typeorm";
import { Review } from "./Review";

@Entity()
export class Streaming extends BaseEntity {
    @Column()
    review_id!: number;

    @Column()
    url!: string;

    @PrimaryColumn()
    provider_id!: number;
}