import {Entity, PrimaryGeneratedColumn, Column, ManyToMany} from "typeorm";
import {FuzzyDate} from "./FuzzyDate";
import {DateRange} from "./DateRange";

@Entity()
export class Entry {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    writeDate: FuzzyDate;

    @Column()
    subjectDate: Date;

    @Column("text")
    text: string;

    @ManyToMany(type => DateRange, dateRange => dateRange.entries)
    dateRanges: DateRange[];
}
