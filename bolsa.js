#!/usr/bin/env node

var amqp = require('amqplib/callback_api');

var args = process.argv.slice(2);

if (args.length == 0) {
  console.log("Usage: receive_logs_topic.js <facility>.<severity>");
  process.exit(1);
}

amqp.connect('amqp://localhost', function(error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function(error1, channel) {
    if (error1) {
      throw error1;
    }
    var exchange = 'BOLSADEVALORES';

    channel.assertExchange(exchange, 'topic', {
      durable: false
    });

    channel.assertQueue('BROKER', {
      exclusive: true
    }, function(error2, q) {
      if (error2) {
        throw error2;
      }
      console.log(' [*] Waiting for logs in %s. To exit press CTRL+C', q.queue);

      args.forEach(function(key) {
        channel.bindQueue(q.queue, exchange, key);
      });

      channel.consume(q.queue, function(msg) {
        console.log(" [x] %s:'%s'", msg.fields.routingKey, msg.content.toString());

        var exchange = 'LIVRODEOFERTAS';

        channel.assertExchange(exchange, 'topic', {
          durable: false
        });

        channel.publish(exchange, msg.fields.routingKey, Buffer.from(msg.content.toString()));

        console.log(" [x] Sent %s:'%s'", msg.fields.routingKey, msg.content.toString());

      }, {
        noAck: false
      });

    });
  });
});
