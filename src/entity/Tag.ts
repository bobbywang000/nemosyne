import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany } from 'typeorm';
import { DateRange } from './DateRange';
import { Note } from './Note';

@Entity()
export class Tag {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        unique: true,
    })
    name: string;

    @ManyToMany((type) => DateRange, (dateRange) => dateRange.entries, {
        cascade: ['insert', 'update'],
    })
    dateRanges: DateRange[];

    @OneToMany((type) => Note, (note) => note.tag, {
        cascade: true,
    })
    notes: Note[];
}
