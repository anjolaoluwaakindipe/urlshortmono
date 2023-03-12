import { Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm';

@Entity()
export class Url {

  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  userId: string;

  @Column()
  originalUrl: string;

  @Column({ unique: true })
  shortenedUrl: string;
}
