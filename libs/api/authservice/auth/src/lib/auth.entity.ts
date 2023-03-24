import { ObjectIdColumn, Column, ObjectID, Entity } from 'typeorm';

export enum Roles {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

@Entity()
export class User {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column({ unique: true })
  email: string;
  @Column({ unique: true })
  username: string;
  @Column()
  firstname: string;
  @Column()
  lastname: string;
  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: Roles,
    array: true,
    default: [Roles[Roles.USER]],
  })
  roles: Roles[] = [Roles.USER];

  @Column({ default: false, type: 'bool' })
  verified = false;

  @Column({ array: true, type: 'array', default: [] })
  refreshTokens: string[];

  @Column({ unique: true })
  verificationTokens: string;

  @Column()
  forgetPasswordToken: string;
}
