var amqp = require('amqplib/callback_api');

const serverToReg = 'serverToReg'
const regToAut = 'regToAut'




// receive messages, check if authenticated, if yes, send to queue to all clients (rabbitmq)
amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }

        
        channel.assertQueue(serverToReg, {
            durable: false
        })
        channel.assertQueue(regToAut, {
            durable: false
        })




        function tryToRegister(token) {
            activePorts = getActivePorts();
            if (activePorts.includes(token)){
                console.log(`[REG] Client with token ${token} is already registered`)
                return false;
            }
            addToDB(token);
            console.log(`[REG] Client with token ${token} is now registered`)
        }

        channel.consume(serverToReg, function(msg) {
            console.log(" [REG] Received %s", msg.content.toString());
            json = JSON.parse(msg.content.toString());
            token = json.token;
            if (tryToRegister(token)){
                jsonData = {
                    "added": token
                }
                channel.sendToQueue(regToAut, Buffer.from(JSON.stringify(jsonData)));
            }
        }, {
            noAck: true
        });

        console.log(" [REG] Waiting for messages in %s. To exit press CTRL+C", serverToReg);

    });
});

