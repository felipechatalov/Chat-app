var amqp = require('amqplib/callback_api');
const { MongoClient } = require('mongodb');

const USER = process.env.MONGO_USER
const PSSW = process.env.MONGO_PSSW
DB_URI = `mongodb+srv://${USER}:${PSSW}@sist-dist.jbuya9g.mongodb.net/`
const client = new MongoClient(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
//client.connect()


async function insertInDb(jsonData) {

    const database = client.db('trabalho');
    const collection = database.collection('mensagens');

    const result = await collection.insertOne(jsonData);
    console.log(`Msg inserida com _id: ${result.insertedId}`);
    
}

const clientSender = 'clienteSender'
const autToServer = 'autToServer'
const serverToAut = 'serverToAut'
const serverToReg = 'serverToReg'

var msgBuffer = new Array(100);
function nextEmptySlot(arr) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == undefined) {
            return i;
        }
    }
    return -1;
}

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
        channel.assertQueue(autToServer, {
            durable: false
        })
        channel.assertQueue(serverToAut, {
            durable: false
        })



        function sendToQueue(token, msg) {
            tosend = '{"token": ' + token + ', "msg": "' + msg + '"}'
            channel.publish(exchange, '', Buffer.from(tosend));
        }

        function isAuthenticated(token, msg) {
            var slot = nextEmptySlot(msgBuffer)
            json = {
                "token": token,
                "id": slot
            }
            msgBuffer[slot] = msg
            channel.sendToQueue(serverToAut, Buffer.from(JSON.stringify(json)))
        }


        channel.consume(clientSender, function(msg) {
            console.log(" [x] Received %s", msg.content.toString());
            json = JSON.parse(msg.content.toString())
            token = json.token
            msg = json.msg
            if (json.reg == 1){
                console.log(`[SERVER] Client with token ${token} want to be registered, message sent to registration server`)
                jsonData = {
                    "token": token,
                    "reg": 1
                }
                channel.sendToQueue(serverToReg, Buffer.from(JSON.stringify(jsonData)))
            }
            else{
                if (isAuthenticated(token, msg)){
                    console.log(`[SERVER] Client with token ${token} is authenticated, message sent to all clients`)
                    sendToQueue(token, msg);
                }
            }
        }, {
            noAck: true
        });

        channel.consume(autToServer, function(msg) {
            console.log(" [SERVER] Received %s", msg.content.toString());
            json = JSON.parse(msg.content.toString())
            token = json.token
            auth = json.auth
            id = json.id
            if (auth){
                console.log(`[SERVER] Client with token ${token} is authenticated, message sent to all clients`)
                sendToQueue(token, msgBuffer[id]);
            }
            else{
                console.log(`[SERVER] Client with token ${token} is not authenticated, message not sent to all clients`)
            }
        }, {
            noAck: true
        });


        console.log("[SERVER] Running");
    });
});


// recebe as mensagens e guarda em um lista com cada id unico
// envia mensagem para o aut, com o id da mensagem e o token do cliente q enviou
// retorna sim ou nao com o id da lista, envia ou exclui a mensagem baseado na resposta

// clietne nao cadastrado vai enviar mensagem para a fila separada somente para isso
// que vai recebe e encaminhar para o servidor de cadastros
// que mantem em um banco de dados todos os tokens cadastrados