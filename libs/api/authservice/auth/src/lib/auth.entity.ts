import { ObjectIdColumn, Column, ObjectID } from 'typeorm';
export class User {
    @ObjectIdColumn()
    _id: ObjectID;

    @Column({unique:true})
    email:string;
    @Column({unique: true})
    username:string;
    @Column()
    firstname:string;
    @Column()
    lastname:string;
    @Column()
    password:string;
    @Column({default: false})
    verified:boolean;

    @Column({array: true})
    refreshTokens:string[]

    @Column({unique:true})
    verificationTokens:string

    @Column({unique:true})
    forgetPasswordToken:string
}