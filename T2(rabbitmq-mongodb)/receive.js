var amqp = require('amqplib/callback_api');

g_channel = null
g_receiver = 'receiver'

amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }
        channel.assertQueue(g_receiver, {
            durable: false
        });
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", receiver);

        channel.consume(receiver, function(msg) {
            console.log(" [x] Received %s", msg.content.toString());
        }, {
            noAck: true
        });
    });
});