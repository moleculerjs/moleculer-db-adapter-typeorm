import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public title: string;

    @Column('text')
    public content: string;

    @Column('int')
    public votes: number;

    @Column({nullable: true})
    public author: number;

    @Column()
    public status: boolean;

    @UpdateDateColumn()
    public updatedAt: number;

}
