import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import { Document, Types } from 'mongoose';
import { ObjectId } from 'bson';
import { RoutingDocument, RoutingSchema } from './routing.scema';
import { DroppedData, DroppedDataSchema } from './droppedData.schema';

export type DroppedProductMessageDocument = DroppedProductMessage & Document;

@Schema()
export class DroppedProductMessage extends Document {
  @Prop()
  reason: string;

  @Prop({ type: DroppedDataSchema, required: true })
  data: DroppedData;

  @Prop({ type: RoutingSchema, required: true })
  routingData: RoutingDocument;

  @Prop({ default: () => new Date() })
  createdAt: Date;

  @Prop({ default: () => new Date() })
  updatedAt: Date;
}

export const DroppedProductMessageSchema = SchemaFactory.createForClass(
  DroppedProductMessage,
);
