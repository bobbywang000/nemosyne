import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Tag } from './Tag';
import { ContentType } from '../enums';

@Entity()
export class Note {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text')
    content: string;

    @Column({
        type: 'simple-enum',
        enum: ContentType,
        default: ContentType.MARKDOWN,
    })
    contentType: ContentType;

    @ManyToOne((type) => Tag, (tag) => tag.notes)
    tag: Tag;

    // Some notes about a person or activity are more important than others
    @Column({
        default: 0,
    })
    importance: number;

    @Column()
    writeDate: Date;
}
