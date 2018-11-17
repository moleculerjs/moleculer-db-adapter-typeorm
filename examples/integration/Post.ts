import {Entity, Column, PrimaryColumn, PrimaryGeneratedColumn} from 'typeorm';

@Entity()
export class Post {

    @PrimaryGeneratedColumn('uuid')
    public id: number;

    @Column()
    public title: string;

    @Column('text')
    public content: string;

    @Column('int')
    public votes: number;

    @Column()
    public author: number;

    @Column()
    public status: boolean;

}
