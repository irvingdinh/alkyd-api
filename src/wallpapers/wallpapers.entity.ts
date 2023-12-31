import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
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

class WallpaperInput {
  @Column()
  @Index()
  engine: string;

  @Column()
  prompt: string;

  @Column()
  @Index()
  styles?: string[];

  @Column()
  @Index()
  tags?: string[];

  @Column()
  @Index()
  colors?: string[];
}

@Entity('wallpapers')
export class WallpaperEntity {
  _id: ObjectId;

  @ObjectIdColumn()
  id: ObjectId;

  @Column(() => WallpaperInput)
  input: WallpaperInput;

  @Column()
  objectKey: string;

  @Column()
  imageKey: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
