import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Entry {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("text")
    content: string;

    @Column()
    lastName: string;

    @Column()
    age: number;

}
