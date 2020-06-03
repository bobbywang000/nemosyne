import {Entity, PrimaryGeneratedColumn, Column, ManyToOne} from "typeorm";
import { Tag } from "./Tag";

@Entity()
export class Note {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("text")
    text: string;

    @ManyToOne(type => Tag, tag => tag.notes)
    tag: Tag;

    // Some notes about a person or activity are more important than others
    @Column({
        default: 0,
    })
    importance: number;

    @Column()
    written: Date;
}
