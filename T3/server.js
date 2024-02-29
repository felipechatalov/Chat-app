var amqp = require('amqplib/callback_api');
const axios = require('axios')
const { MongoClient } = require('mongodb');

const USER = process.env.MONGO_USER
const PSSW = process.env.MONGO_PSSW
DB_URI = `mongodb+srv://${USER}:${PSSW}@sist-dist.jbuya9g.mongodb.net/`
const client = new MongoClient(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect()


async function insertInDb(jsonData) {

    const database = client.db('trabalho');
    const collection = database.collection('mensagens');

    const result = await collection.insertOne(jsonData);
    console.log(`Msg inserida com _id: ${result.insertedId}`);
    
}

var clientReceiver = 'clienteReceiver'
var clientSender = 'clienteSender'


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



        
        channel.assertQueue(clientSender, {
            durable: false
        })
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", clientReceiver);



        function sendToQueue(token, msg) {
            tosend = '{"token": ' + token + ', "msg": "' + msg + '"}'
            channel.publish(exchange, '', Buffer.from(tosend));
        }

        function sendIfAuthenticated(token, msg) {
            axios.get(`http://localhost:3001/auth?token=${token}`)
                .then((response) => {
                    if (response.data.auth) {
                        console.log(`[SERVER] Client with token ${token} is authenticated, message sent to queue`)
                        sendToQueue(token, msg)
                        jsonData = {
                            "token": token,
                            "msg": msg
                        }
                        insertInDb(jsonData)
                    } else {
                        console.log(`[SERVER] Client with token ${token} is not authenticated`)
                    }
                })
                .catch((error) => {
                    console.log(error)
                })
        }


        channel.consume(clientSender, function(msg) {
            console.log(" [x] Received %s", msg.content.toString());
            json = JSON.parse(msg.content.toString())
            token = json.token
            msg = json.msg

            sendIfAuthenticated(token, msg)
        }, {
            noAck: true
        });
    });
});
