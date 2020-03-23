#!/usr/bin/env node
 // const fs = require('fs');
 const moment = require ('moment');
var amqp = require('amqplib/callback_api');
var args = process.argv.slice(2);

if (args.length == 0) {
  console.log("Usage: receive_logs_topic.js <facility>.<severity>");
  process.exit(1);
}

amqp.connect('amqp://localhost', function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }
    var exchange = 'LIVRODEOFERTAS';

    channel.assertExchange(exchange, 'topic', {
      durable: false
    });

    channel.assertQueue('', {
      exclusive: true
    }, function (error2, q) {
      if (error2) {
        throw error2;
      }
      console.log(' [*] Waiting for logs. To exit press CTRL+C');

      args.forEach(function (key) {
        channel.bindQueue(q.queue, exchange, key);
      });

      var venda = [];
      var compra = [];

      channel.consume(q.queue, function (msg) {
        let sentido = msg.fields.routingKey.split(".")[0]
        let ativo = msg.fields.routingKey.split(".")[1]
        let msgJSON = JSON.parse(msg.content.toString())
        msgJSON.ativo = ativo

        if (sentido == "compra")
            preencheCompra(compra, venda, msgJSON)
        else
          preencheVenda(compra, venda, msgJSON)

          console.log("Compra -",compra)
          console.log("Venda - ",venda)

      }, {
        noAck: false
      });
    });
  });
});

function transacao(msg, channel) {

  channel.publish('TRANSACAO', msg.fields.routingKey, Buffer
    .from("data:" + moment() + msg.content.toString()));

}

function preencheCompra(msg, channel, compra, venda, elementoCompra) {

  let ocorreuTransacao = false;
  let indexVendaCompativel;
  //  VERIFICA O ARRAY VENDA PARA CASO HAJA TRANSAÇÃO
  for (let i = 0; i < venda.length; i++) {

    if (venda[i].ativo == elementoCompra.ativo) {
      
    //PRECO COMPATIVEL
      if (venda[i].val <= elementoCompra.val) {
        ocorreuTransacao = true;
        indexVendaCompativel = i;
        break;
      }
    }
  }

  if (ocorreuTransacao) {
    let result = elementoCompra.quant - venda[i].quant
    //se sobrou ordem de compra a função é chamada de novo
    if (result > 0) {
      elementoCompra.quant = result
      preencheCompra(elementoCompra)
    } else if (result == 0) {
      venda.splice(indexVendaCompativel, 1)
    } else if (result < 0) {//se o resultado é menor que 0, resta venda e o valor é atualizado
      venda[indexVendaCompativel].quant = result * -1
    }
    transacao(msg, channel);
  } else{
    compra.push(elementoCompra)
  }
}

function preencheVenda(msg, channel, compra, venda, elementoVenda) {

  let ocorreuTransacao = false;
  let indexCompraCompativel;
  //  VERIFICA O ARRAY COMPRA PARA CASO HAJA TRANSAÇÃO
  for (let i = 0; i < compra.length; i++) {
    if (compra[i].ativo == elementoVenda.ativo) {
      //PRECO COMPATIVEL
      if (compra[i].val <= elementoVenda.val) {
        ocorreuTransacao = true;
        indexCompraCompativel = i;
        break;
      }
    }
  }

  if (ocorreuTransacao) {
    transacao();
    let result = elementoVenda.quant - compra[indexCompraCompativel].quant

    if (result > 0) {//se sobrou ordem de venda a função é chamada de novo
      elementoVenda.quant = result
      preencheVenda(elementoVenda)
    } else if (result == 0) {
      compra.splice(indexCompraCompativel, 1)
    } else if (result < 0) {//se o resultado é menor que 0, resta compra e o valor é atualizado
      compra[indexCompraCompativel].quant = result * -1
    }
    transacao(msg, channel);
  } else{
    venda.push(elementoVenda)
  }
}
