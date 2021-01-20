import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany } from 'typeorm';
import { DateRange } from './DateRange';

@Entity()
export class Tag {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        unique: true,
    })
    name: string;

    @ManyToMany((type) => DateRange, (dateRange) => dateRange.tags)
    dateRanges: DateRange[];
}
