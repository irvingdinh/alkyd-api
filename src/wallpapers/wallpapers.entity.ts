import {
  Column,
  CreateDateColumn,
  Entity,
  ObjectId,
  ObjectIdColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('collections')
export class CollectionEntity {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  coverImageKey: string;

  @Column({ default: false })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('wallpapers')
export class WallpaperEntity {
  _id: ObjectId;

  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  objectKey: string;

  @Column()
  imageKey: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
