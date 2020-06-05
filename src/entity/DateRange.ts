import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToOne, JoinColumn, Unique } from 'typeorm';
import { Entry } from './Entry';
import { Tag } from './Tag';
import { Impression } from './Impression';

@Entity()
@Unique('StartAndEnd', ['start', 'end'])
export class DateRange {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    start: Date;

    @Column()
    end: Date;

    @Column({
        nullable: true,
    })
    title: string;

    @OneToOne((type) => Impression, (impression) => impression.dateRange)
    @JoinColumn()
    impression: Impression;

    @Column('simple-array', {
        // See https://github.com/typeorm/typeorm/issues/1532, since simple-array is stored as text
        // under the hood, we need to initialize the default to an empty string, rather than an empty array.
        default: '',
    })
    events: string[];

    @ManyToMany((type) => Entry, (entry) => entry.dateRanges)
    entries: Entry[];

    @ManyToMany((type) => Entry, (entry) => entry.dateRanges)
    tags: Tag[];
}
