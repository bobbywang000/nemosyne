import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToOne, JoinColumn } from 'typeorm';
import { Entry } from './Entry';
import { Tag } from './Tag';
import { Impression } from './Impression';

@Entity()
export class DateRange {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    start: Date;

    // TODO: figure out how to set this (and title) as optional
    @Column()
    end: Date;

    @Column()
    title: string;

    @OneToOne((type) => Impression, (impression) => impression.dateRange)
    @JoinColumn()
    impression: Impression;

    @Column('simple-array')
    events: string[];

    @ManyToMany((type) => Entry, (entry) => entry.dateRanges)
    entries: Entry[];

    @ManyToMany((type) => Entry, (entry) => entry.dateRanges)
    tags: Tag[];
}
