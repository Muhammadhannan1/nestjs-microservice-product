import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import { Document, Types } from 'mongoose';
import { ObjectId } from 'bson';

export type DroppedDataDocument = DroppedData & Document;

@Schema()
export class DroppedData extends Document {
  @Prop()
  productId: ObjectId | null;

  @Prop()
  userId: ObjectId;

  @Prop()
  name: string;

  @Prop()
  price: number;
}

export const DroppedDataSchema = SchemaFactory.createForClass(DroppedData);
