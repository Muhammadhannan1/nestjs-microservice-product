import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConsumeMessage } from 'amqplib';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from './schema/product.schema';
import { Model } from 'mongoose';
import { ObjectId } from 'bson';
import { DroppedProductMessage } from './schema/droppedMessage.schema';

@Injectable()
export class AppService {
  constructor(
    private readonly AmqpConnection: AmqpConnection,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(DroppedProductMessage.name)
    private readonly droppedMessageModel: Model<DroppedProductMessage>,
  ) {}

  async create(data: any) {
    let dataContent = data.content.toString();
    if (typeof dataContent === 'string') {
      dataContent = JSON.parse(dataContent);
    }
    const product = await this.productModel.findOne({
      userId: new ObjectId(dataContent.user.userId),
      name: dataContent.payload.name,
    });
    if (product) {
      console.log('Notify that Product not not be created due to same name');
    } else {
      await this.productModel.create({
        name: dataContent.payload.name,
        userId: new ObjectId(dataContent.user.userId),
        price: dataContent.payload.price,
      });
      console.log('Notify that Product created successfully');
    }
  }
  async getAllProducts(data) {
    const products = await this.productModel.find();
    if (!products.length) {
      return { status: true, message: 'No Products Found', data: products };
    }
    return { status: true, message: 'Products Found', data: products };
  }
  async getProductDetail(data) {
    console.log('data', data);
    const products = await this.productModel.findById(data.productId);

    if (!products) {
      return { status: true, message: 'Product does not exists', data: null };
    }
    return { status: true, message: 'Products Found', data: products };
  }

  async updateProduct(data) {
    let dataContent = data.content.toString();
    if (typeof dataContent === 'string') {
      dataContent = JSON.parse(dataContent);
    }
    const product = await this.productModel.findOne({
      userId: new ObjectId(dataContent.user.userId),
      _id: new ObjectId(dataContent.payload.productId),
    });
    if (!product) {
      console.log('notify that his product does not exist');
      return;
    }
    if (dataContent.payload.name) {
      const productNameExist = await this.productModel.findOne({
        name: dataContent.payload.name,
      });
      if (productNameExist) {
        console.log(
          'notify that his product one more product exist with same name',
        );
        return;
      }
    }
    await this.productModel.findByIdAndUpdate(
      dataContent.payload.productId,
      { name: dataContent.payload.name, price: dataContent.payload.price },
      { returnDocument: 'after' },
    );
    console.log('Notify that Product updated successfully');
  }
  async deleteProduct(data) {
    let dataContent = data.content.toString();
    if (typeof dataContent === 'string') {
      dataContent = JSON.parse(dataContent);
    }
    const product = await this.productModel.findOne({
      userId: new ObjectId(dataContent.user.userId),
      _id: new ObjectId(dataContent.payload.productId),
    });
    if (!product) {
      console.log('notify that his product does not exist');
      return;
    }
    await this.productModel.findByIdAndDelete(dataContent.payload.productId);
    console.log('Notify that his product has been deleted');
  }
  async handleDeadLetter(amqpMsg: ConsumeMessage) {
    try {
      const deathHeader = amqpMsg.properties.headers['x-death'] || [];
      const retryCount = deathHeader.length > 0 ? deathHeader[0].count : 0;
      const deadLetterReason =
        deathHeader.length > 0 ? deathHeader[0].reason : null;

      // console.log('deathHeader', deathHeader);
      // console.log('retryCount', retryCount);
      // console.log('deadLetterReason', deadLetterReason);
      // console.log('routingkey', deathHeader[0]['routing-keys'][0]);
      // console.log('amqpMsg', amqpMsg);
      if (
        retryCount <= 3 &&
        deadLetterReason !== 'expired' &&
        deadLetterReason !== 'maxlen'
      ) {
        await this.retryMessage(amqpMsg, retryCount);
      } else if (deadLetterReason === 'expired') {
        await this.requeueMessageWithIncreasedTTL(amqpMsg);
      } else {
        console.error(
          'Max retry attempts reached or message dropped due to TTL/length limit. Message will be handled separately.',
        );
        await this.handleDroppedMessage(amqpMsg);
      }
    } catch (error) {
      console.error('Failed to handle DLQ message:', error.message);
    }
  }

  private async retryMessage(amqpMsg: ConsumeMessage, retryCount: number) {
    await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
    console.log('in retryMessage');
    await this.AmqpConnection.publish(
      amqpMsg.properties.headers['x-last-death-exchange'] as string,
      amqpMsg.properties.headers['x-death'][0]['routing-keys'][0] as string,
      amqpMsg.content,
      this.getMessageOptions(amqpMsg.properties, retryCount + 1),
    );
  }

  private async requeueMessageWithIncreasedTTL(amqpMsg: ConsumeMessage) {
    const newTTL = (
      parseInt(amqpMsg.properties.expiration || '0', 10) + 10000
    ).toString(); // Increase TTL by 10 seconds
    console.log('in requeueMessageWithIncreasedTTL');
    await this.AmqpConnection.publish(
      amqpMsg.properties.headers['x-last-death-exchange'] as string,
      amqpMsg.properties.headers['x-death'][0]['routing-keys'][0] as string,
      amqpMsg.content,
      this.getMessageOptions(amqpMsg.properties, undefined, newTTL),
    );
  }

  private getMessageOptions(
    properties: any,
    retryCount?: number,
    expiration?: string,
  ) {
    return {
      headers: {
        ...properties.headers,
        ...(retryCount ? { 'x-retry-count': retryCount } : {}),
      },
      persistent: properties.deliveryMode === 2,
      contentType: properties.contentType,
      contentEncoding: properties.contentEncoding,
      priority: properties.priority,
      correlationId: properties.correlationId,
      replyTo: properties.replyTo,
      expiration: expiration || properties.expiration,
      messageId: properties.messageId,
      timestamp: properties.timestamp,
      type: properties.type,
      userId: properties.userId,
      appId: properties.appId,
      clusterId: properties.clusterId,
    };
  }
  private async handleDroppedMessage(amqpMsg: ConsumeMessage) {
    let dataContent = amqpMsg.content.toString();
    if (typeof dataContent === 'string') {
      dataContent = JSON.parse(dataContent);
    }
    console.log('amqpMsg', amqpMsg);
    await this.droppedMessageModel.create({
      reason: amqpMsg.properties.headers['x-last-death-reason'],
      data: {
        productId: dataContent.payload.productId
          ? new ObjectId(dataContent.payload.productId)
          : null,
        name: dataContent.payload.name,
        price: dataContent.payload.price,
        userId: new ObjectId(dataContent.user.userId),
      },
      routingData: {
        exchange: amqpMsg.properties.headers['x-last-death-exchange'],
        queue: amqpMsg.properties.headers['x-last-death-queue'],
        routingKey: amqpMsg.properties.headers['x-death'][0]['routing-keys'][0],
      },
    });
    console.error('Handling dropped message:', amqpMsg.content.toString());
    console.log('reason', amqpMsg.properties.headers['x-last-death-reason']);
    console.log('exchage', amqpMsg.properties.headers['x-last-death-exchange']);
    console.log('queue', amqpMsg.properties.headers['x-last-death-queue']);
    console.log(
      'routingKey',
      amqpMsg.properties.headers['x-death'][0]['routing-keys'][0],
    );

    console.log('userId', dataContent.user.userId);
    console.log('product name', dataContent.payload.name);
    console.log('product price', dataContent.payload.price);
    console.log('product id', dataContent.payload.productId);
    console.log('amqpMsg', amqpMsg);
  }
  getHello() {
    return 'Hello World';
  }
}
