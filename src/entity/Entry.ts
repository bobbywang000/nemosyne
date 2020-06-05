import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, Unique } from 'typeorm';
import { DateRange } from './DateRange';
import { ContentType } from '../enums';

@Entity()
@Unique('WrittenAndSubject', ['writeDate', 'subjectDate'])
export class Entry {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    writeDate: Date;

    @Column()
    subjectDate: Date;

    @Column('text')
    content: string;

    @Column({
        type: 'simple-enum',
        enum: ContentType,
        default: ContentType.MARKDOWN,
    })
    content_type: ContentType;

    @ManyToMany((type) => DateRange, (dateRange) => dateRange.entries)
    dateRanges: DateRange[];
}
