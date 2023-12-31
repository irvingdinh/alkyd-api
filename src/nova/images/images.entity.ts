import {
  Column,
  CreateDateColumn,
  Entity,
  ObjectId,
  ObjectIdColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('images')
export class ImageEntity {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  objectKey: string;

  @Column()
  imageKey: string;

  @Column({ default: 0 })
  width: number;

  @Column({ default: 0 })
  height: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
