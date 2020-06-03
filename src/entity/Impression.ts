import {Entity, PrimaryGeneratedColumn, Column, AfterLoad} from "typeorm";

@Entity()
export class Impression {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    written: Date;

    @Column()
    positivity: number;

    @Column()
    negativity: number;

    protected total: number;

    @AfterLoad()
    setTotal() {
        this.total = this.positivity + this.negativity;
    }
}
