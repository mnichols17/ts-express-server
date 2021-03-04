import { BaseEntity, Entity, Column, PrimaryColumn, BeforeInsert, OneToMany} from "typeorm";
import bcrypt from 'bcryptjs';
import {v4 as uuidv4} from 'uuid';

@Entity()
export class Users extends BaseEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column()
    email!: string;

    @Column()
    username!: string;

    @Column()
    password!: string;

    @Column()
    firstname!: string;

    @Column()
    lastname!: string;

    @Column()
    confirmed!: boolean;

    // @OneToMany(() => Lists, list => list.user_id)
    // watchlist!: Lists[];

    @BeforeInsert()
    async handleInsert() { 
        this.password = await bcrypt.hash(this.password, await bcrypt.genSalt(10))
        this.id = uuidv4();
        this.confirmed = false;
    }
}