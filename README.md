
Para rodar o container do RabbitMQ:
-  docker run -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

Para enviar a mensagem no lado do Broker:
- node broker_envia.js venda.petr4 "{\"quant\": 100, \"val\": 500, \"corretora\": \"brok1\"}"

Terminal de transações:
- node transacao.js * . #  <!-- - sem espaços -->

Terminal da Bolsa de Valores:
- node bolsa.js * . #  <!-- - sem espaços -->

Terminal da Lista de compra:
- node lista.js compra. * .lista  <!-- - sem espaços -->

Terminal da Lista de venda:
- node lista.js venda. * .lista  <!-- - sem espaços -->
