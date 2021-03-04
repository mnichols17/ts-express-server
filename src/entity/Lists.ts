import { BaseEntity, Entity, Column, PrimaryColumn, ManyToOne, JoinColumn} from "typeorm";
import { Users } from "./Users";

@Entity()
export class Lists extends BaseEntity {
    @PrimaryColumn()
    user_id!: string;
    // @ManyToOne(() => Users, user => user.id)
    // @JoinColumn({name: 'user_id'})
    // owner!: Users;

    @PrimaryColumn()
    type!: string;

    @PrimaryColumn()
    review_id!: number;
}