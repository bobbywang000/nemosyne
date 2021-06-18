import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToOne, JoinColumn, Unique, JoinTable } from 'typeorm';
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

    @ManyToMany((type) => Tag, (tag) => tag.dateRanges)
    @JoinTable()
    tags: Tag[];

    entries: Entry[];

    length(): number {
        return this.end.getTime() - this.start.getTime();
    }
}
