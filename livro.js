#!/usr/bin/env node
const fs = require('fs');

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
    var exchange = 'LIVRODEOFERTAS';

    channel.assertExchange(exchange, 'topic', {
      durable: false
    });

    channel.assertQueue('', {
      exclusive: true
    }, function(error2, q) {
      if (error2) {
        throw error2;
      }
      let Compra = [];
      let Venda = [];

      console.log(' [*] Waiting for logs. To exit press CTRL+C');

      args.forEach(function(key) {
        channel.bindQueue(q.queue, exchange, key);
      });

      channel.consume(q.queue, function(msg) {
        let sentido = msg.fields.routingKey.split(".")[0]
        let ativo = msg.fields.routingKey.split(".")[1]
        let msgJSON = JSON.parse(msg.content.toString())

        msgJSON.ativo = ativo

        if(sentido == "venda")
            FilaVenda.push(msgJSON)
        if(sentido == "compra")
            FilaCompra.push(msgJSON)

      }, {
        noAck: false
      });
    });
  });
});