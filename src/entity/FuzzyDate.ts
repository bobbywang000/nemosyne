import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class FuzzyDate {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    date: Date;

    // This is the uncertainty in dates for things that were written a long time ago.
    @Column({
        default: 0
    })
    uncertainty: number;
}
