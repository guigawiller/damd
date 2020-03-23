#!/usr/bin/env node
 // const fs = require('fs');
var amqp = require('amqplib/callback_api');
var args = process.argv.slice(2);

var compra = [];
var venda = [];

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

      channel.consume(q.queue, function (msg) {
        cont++;
        let sentido = msg.fields.routingKey.split(".")[0]
        let ativo = msg.fields.routingKey.split(".")[1]
        let msgJSON = JSON.parse(msg.content.toString())
        msgJSON.ativo = ativo

        if (msgJSON.sentido == "compra")
          preencheCompra(msgJSON)
        else
          preencheVenda(msgJSON)

          console.log(compra)

      }, {
        noAck: false
      });
    });
  });
});

function transacao() {
  
}

function preencheCompra(elementoCompra) {
  let ocorreuTransacao = false;
  let indexVendaCompativel;
  //  VERIFICA O ARRAY VENDA PARA CASO HAJA TRANSAÇÃO
  for (let i = 0; i < venda.length; i++) {
    if (venda.ativo == elementoCompra.ativo) {
      //PRECO COMPATIVEL
      if (venda[i].val <= elementoCompra.val) {
        ocorreuTransacao = true;
        indexVendaCompativel = i;
        break;
      }
    }
  }

  if (ocorreuTransacao) {
    transacao();
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
  } else{
    compra.push(elementoCompra)
  }
}

function preencheVenda(elementoVenda) {
  let ocorreuTransacao = false;
  let indexCompraCompativel;
  //  VERIFICA O ARRAY COMPRA PARA CASO HAJA TRANSAÇÃO
  for (let i = 0; i < compra.length; i++) {
    if (compra.ativo == elementoVenda.ativo) {
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
    let result = elementoVenda.quant - compra[i].quant
    
    if (result > 0) {//se sobrou ordem de venda a função é chamada de novo
      elementoVenda.quant = result
      preencheVenda(elementoVenda)
    } else if (result == 0) {
      compra.splice(indexCompraCompativel, 1)
    } else if (result < 0) {//se o resultado é menor que 0, resta compra e o valor é atualizado
      compra[indexCompraCompativel].quant = result * -1
    }
  } else{
    venda.push(elementoVenda)
  }
}