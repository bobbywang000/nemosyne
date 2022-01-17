import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { DateRange } from './DateRange';

@Entity()
export class Impression {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    written: Date;

    @OneToOne((type) => DateRange, (dateRange) => dateRange.impression)
    dateRange: DateRange;

    @Column()
    positivity: number;

    @Column()
    negativity: number;
}
