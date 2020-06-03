import {Entity, PrimaryGeneratedColumn, Column, AfterLoad} from "typeorm";
import {FuzzyDate} from "./FuzzyDate";

@Entity()
export class Impression {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    written: FuzzyDate;

    @Column()
    positivity: number;

    @Column()
    negativity: number;

    protected total: number;

    @AfterLoad()
    setTotal() {
        this.total = this.positivity + this.negativity;
    }
}
