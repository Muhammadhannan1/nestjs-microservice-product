import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import { Document, Types } from 'mongoose';
import { ObjectId } from 'bson';

export type RoutingDocument = Routing & Document;

@Schema()
export class Routing extends Document {
  @Prop()
  exchange: string;

  @Prop()
  queue: string;

  @Prop()
  routingKey: string;
}

export const RoutingSchema = SchemaFactory.createForClass(Routing);
