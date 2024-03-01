var amqp = require('amqplib/callback_api');

SELF_PORT = 5001
if (process.argv.length == 3) {
    SELF_PORT = process.argv[2]
}

var clientReceiver = 'clienteReceiver'
var clientSender = 'clienteSender'
console.log(`Client token: ${SELF_PORT}`)
// receive messages, check if authenticated, if yes, send to queue to all clients (rabbitmq)
amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }

        var exchange = 'chat'

        channel.assertExchange(exchange, 'fanout', {
            durable: false
        });

        channel.assertQueue('', {
            exclusive:true
        }, function(error2, q) {
            if (error2){
                throw error2
            }

            console.log("[Client] Waiting for other clients messages...");
            channel.bindQueue(q.queue, exchange, '');

            channel.consume(q.queue, function(msg) {
                if (msg.content) {
                    json = JSON.parse(msg.content.toString())
                    token = json.token
                    msg = json.msg
    
                    if (token != SELF_PORT) {
                        console.log(`[${token}]: ${msg}`)
                    }
                    else{
                        console.log(`[SENT]: ${msg}`)
                    } 
                }}, 
                {
                noAck: true
            });

            setInterval(() => {
                msg = '{"token": "' + SELF_PORT + '", "msg": "Hello world from client ' + SELF_PORT + '"}'
                channel.sendToQueue(clientSender, Buffer.from(msg))
            }, 3000);

        });
    });
});
