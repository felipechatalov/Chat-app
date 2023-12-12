const express = require('express')
const cors = require('cors')
const axios = require('axios')

const app = express()

app.use(express.json())


const base_url = "http://localhost:";



var PORT = 3000
PRIVATE_KEY = generateKey(9999)
var TOKEN = ""

if (process.argv.length > 2) {
    PORT = process.argv[2]
}
if (process.argv.length > 3) {
    PORT = process.argv[2]
    PRIVATE_KEY = process.argv[3]
}

PUBLIC_KEY = PRIVATE_KEY + "pblc"


// random key generator
function generateKey(x) {
    let number = Math.floor(Math.random() * x).toString()
    while (number.length < 4) {
        number = "0" + number
    }
    return number
}

// ask for a validation token to aut server
// based on public key
// the server then holds the public key and the port associated with the given token
// for future validation
async function getToken(){
    var temp = base_url + "3001/gettoken"
    console.log("asking for token: " + temp)
    try {
        const response = await axios.get(temp, {params: {port: PORT, key: PUBLIC_KEY}})
        console.log(response.data.token)
        TOKEN = response.data.token
        return response.data.token
    } catch (error) {
        console.error(error)
    }
}

// ask to start a conversation with a given dst(port)
// based on public key
// the receiver then ask the aut server if the key + port is valid
// if yes then the conversation starts and both clients can talk
// until endConversation is called by any of the clients
// if false then the conversation is not started
function startConversation(dst) {
    //var temp = url + dst +"/startconv/" + port.toString() + "/" + PUBLIC_KEY

}


// used to receive messages
app.post("/msg", (req, res) => {
    let msg = req.query.msg
    let port = req.query.port
    console.log(`[Received Message]  ${port}: ${msg}`)

    return res.status(200).send("message received")
})


async function sendMsgToAll(msg){
    var url = base_url + "3001/msg"
    try {
        const response = await axios.post(url, null, {params: {token: TOKEN, port: PORT, msg: msg}})
        console.log(`[Sent Message]      ${PORT}: ${msg}`)
        return response.data
    } catch (error) {
        console.error(error)
    }
}

// used to send messages after a conversation is started
// only if the aut server validates the key + port of both clients
app.get("/talk/:msg", (req, res) => {
    let msg = req.params.msg
    //console.log(msg)
    // send message to dst
    sendMsgToAll(msg)
    return res.status(200).send("message sent")
})

function main(){
    getToken()
}
main()

app.listen(PORT, () => {console.log("Client server " + PRIVATE_KEY + " is running on port: " + PORT)})


