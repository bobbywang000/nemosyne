import { Entity, PrimaryGeneratedColumn, Column, AfterLoad, OneToOne } from 'typeorm';
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

    total: number;

    @AfterLoad()
    setTotal() {
        this.total = this.positivity + this.negativity;
    }
}
