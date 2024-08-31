import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Product, ProductSchema } from './schema/product.schema';
import {
  DroppedProductMessage,
  DroppedProductMessageSchema,
} from './schema/droppedMessage.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    MongooseModule.forRoot('mongodb://localhost:27017/microservice'), // Database for products
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    MongooseModule.forFeature([
      { name: DroppedProductMessage.name, schema: DroppedProductMessageSchema },
    ]),
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: 'product_exchange', // Name of the exchange
          type: 'topic', // Type of exchange,
          // options: {
          //   'x-dead-letter-exchange': 'product_dlx_exchange',
          //   'x-dead-letter-routing-key': 'product.create',
          // },
        },
        {
          name: 'product_dlx_exchange',
          type: 'direct',
        },
      ],
      // queues: [
      //   {
      //     name: 'product_create_queue',
      //     options: {
      //       durable: true,
      //       arguments: {
      //         'x-dead-letter-exchange': 'product_dlx_exchange',
      //         'x-dead-letter-routing-key': 'product.dead-letter',
      //         'x-message-ttl': 10000, // 10 seconds TTL for testing
      //         'x-max-length': 3, // Max length of 3 messages for testing
      //       },
      //     },
      //   },

      //   {
      //     name: 'product_update_queue',
      //     options: {
      //       durable: true,
      //       arguments: {
      //         'x-dead-letter-exchange': 'product_dlx_exchange',
      //         'x-dead-letter-routing-key': 'product.dead-letter',
      //         'x-message-ttl': 10000, // 10 seconds TTL for testing
      //         'x-max-length': 3, // Max length of 3 messages for testing
      //       },
      //     },
      //   },
      //   {
      //     name: 'product_delete_queue',
      //     options: {
      //       durable: true,
      //       arguments: {
      //         'x-dead-letter-exchange': 'product_dlx_exchange',
      //         'x-dead-letter-routing-key': 'product.dead-letter',
      //         'x-message-ttl': 10000, // 10 seconds TTL for testing
      //         'x-max-length': 3, // Max length of 3 messages for testing
      //       },
      //     },
      //   },
      //   {
      //     name: 'product_get_queue',
      //     options: {
      //       durable: true,
      //       arguments: {
      //         'x-dead-letter-exchange': 'product_dlx_exchange',
      //         'x-dead-letter-routing-key': 'product.dead-letter',
      //         'x-message-ttl': 10000, // 10 seconds TTL for testing
      //         'x-max-length': 3, // Max length of 3 messages for testing
      //       },
      //     },
      //   },
      //   {
      //     name: 'product_dlx_queue',
      //     options: {
      //       durable: true,
      //       arguments: {
      //         'x-message-ttl': 60000, // 1 minute TTL for DLQ
      //         'x-max-length': 1000, // Max length for DLQ
      //       },
      //     },
      //   },
      // ],

      uri: 'amqp://guest:guest@localhost:5672', // RabbitMQ server URI
      connectionInitOptions: { wait: true },
      enableControllerDiscovery: true,
    }),
    AppModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
