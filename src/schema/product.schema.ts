import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import { Document, Types } from 'mongoose';
import { ObjectId } from 'bson';

export type ProductDocument = Product & Document;

@Schema()
export class Product extends Document {
  @Prop()
  name: string;

  @Prop()
  price: number;

  @Prop()
  userId: ObjectId;

  @Prop({ default: () => new Date() })
  createdAt: Date;

  @Prop({ default: () => new Date() })
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
