import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany } from 'typeorm';
import { DateRange } from './DateRange';
import { Note } from './Note';

@Entity()
export class Tag {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany((type) => DateRange, (dateRange) => dateRange.entries)
    dateRanges: DateRange[];

    @OneToMany((type) => Note, (note) => note.tag)
    notes: Note[];
}
