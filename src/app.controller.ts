import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import {
  RabbitSubscribe,
  RabbitRPC,
  Nack,
  defaultNackErrorHandler,
} from '@golevelup/nestjs-rabbitmq';
import { ConsumeMessage } from 'amqplib';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @RabbitSubscribe({
    exchange: 'product_exchange',
    routingKey: 'product.create',
    queue: 'product_create_queue',
    queueOptions: {
      deadLetterExchange: 'product_dlx_exchange',
      deadLetterRoutingKey: 'product.dead-letter',
      messageTtl: 10000,
      maxLength: 3,
    },
    errorHandler: defaultNackErrorHandler,
  })
  async handleCreateProduct(msg: {}, amqpMsg: ConsumeMessage) {
    try {
      await this.appService.create(amqpMsg);
      // Simulate failure for demonstration
      // throw new Error('Create product processing failed');
    } catch (error) {
      console.error('Error:', error.message);
      // throw new Nack(false);
      return new Nack();
    }
  }

  @RabbitRPC({
    exchange: 'product_exchange',
    routingKey: 'product.get',
    queue: 'product_get_queue',
    queueOptions: {
      deadLetterExchange: 'product_dlx_exchange',
      deadLetterRoutingKey: 'product.dead-letter',
      messageTtl: 10000,
      maxLength: 3,
    },
    errorHandler: defaultNackErrorHandler,
  })
  async handleGetProduct(data) {
    try {
      if (data.apiType === 'getAll') {
        return this.appService.getAllProducts(data);
      }
      if (data.apiType === 'detail') {
        return this.appService.getProductDetail(data);
      }
    } catch (error) {
      console.error('Error:', error.message);
      // throw new Nack(false);
      return new Nack();
    }
  }

  @RabbitSubscribe({
    exchange: 'product_exchange',
    routingKey: 'product.update',
    queue: 'product_update_queue',
    queueOptions: {
      deadLetterExchange: 'product_dlx_exchange',
      deadLetterRoutingKey: 'product.dead-letter',
      messageTtl: 10000,
      maxLength: 3,
    },
    errorHandler: defaultNackErrorHandler,
  })
  async handleUpdateProduct(msg: {}, amqpMsg: ConsumeMessage) {
    try {
      await this.appService.updateProduct(amqpMsg);
    } catch (error) {
      console.error('Error:', error.message);
      // throw new Nack(false);
      return new Nack();
    }
  }

  @RabbitSubscribe({
    exchange: 'product_exchange',
    routingKey: 'product.delete',
    queue: 'product_delete_queue',
    queueOptions: {
      deadLetterExchange: 'product_dlx_exchange',
      deadLetterRoutingKey: 'product.dead-letter',
      messageTtl: 10000,
      maxLength: 3,
    },
    errorHandler: defaultNackErrorHandler,
  })
  async handleDeleteProduct(msg: {}, amqpMsg: ConsumeMessage) {
    try {
      await this.appService.deleteProduct(amqpMsg);
      // throw new Error('Update product processing failed');
    } catch (error) {
      console.error('Error:', error.message);
      // throw new Nack(false);
      return new Nack();
    }
  }

  @RabbitSubscribe({
    exchange: 'product_dlx_exchange',
    routingKey: 'product.dead-letter',
    queue: 'product_dlx_queue',
    queueOptions: {
      messageTtl: 60000,
      maxLength: 1000,
    },
  })
  async handleCreateProductDLQ(msg: {}, amqpMsg: ConsumeMessage) {
    // console.log('data in DLQ', data);
    await this.appService.handleDeadLetter(amqpMsg);
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
