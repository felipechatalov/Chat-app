var amqp = require('amqplib/callback_api');

VALID_PORTS = ["5001", "5002"]

serverToAut = 'serverToAut'
autToServer = 'autToServer'
regToAut = 'regToAut'

amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }

        
        channel.assertQueue(autToServer, {
            durable: false
        })
        channel.assertQueue(serverToAut, {
            durable: false
        })
        channel.assertQueue(regToAut, {
            durable: false
        })

        console.log(" [AUT] Waiting for messages in %s. To exit press CTRL+C", serverToAut);


        function isAuthenticated(token, id) {
            if (VALID_PORTS.includes(token)) {
                console.log(`[AUT] Client with token ${token} is authenticated`)
                jsonData = {
                    "token": token,
                    "id": id,
                    "auth": true
                }
                channel.sendToQueue(autToServer, Buffer.from(JSON.stringify(jsonData)))
            } else {
                console.log(`[AUT] Client with token ${token} is not authenticated`)
                jsonData = {
                    "token": token,
                    "id": id,
                    "auth": false
                }
                channel.sendToQueue(autToServer, Buffer.from(JSON.stringify(jsonData)))
            }
        }

        // receive:
        // {"token": "5001", "id": "1"}
        channel.consume(serverToAut, function(msg) {
            console.log(" [AUT] Received %s", msg.content.toString());
            json = JSON.parse(msg.content.toString())
            token = json.token
            id = json.id
            isAuthenticated(token, id)
        }, {
            noAck: true
        });

        channel.consume(regToAut, function(msg) {
            console.log(" [AUT] Received %s", msg.content.toString());
            json = JSON.parse(msg.content.toString())
            token = json.added
            VALID_PORTS.push(token)
            console.log(`[AUT] new list of valid ports: ${VALID_PORTS}`)
        }, {
            noAck: true
        });

    });
});


// a cada cadastro novo no banco, o servidor de registro envia mensagem falando para se atualizar
// que tem o campo added: token, que ira ser adicionad na lista