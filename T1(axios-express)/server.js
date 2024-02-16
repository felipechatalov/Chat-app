const express = require('express')
const cors = require('cors')
const axios = require('axios')

const app = express()
var port = 8080
app.use(cors())

PUBLIC_SERVER_TOKEN = "publicservertoken"
PRIVATE_SERVER_TOKEN = "privateservertoken"

PRIVATE_AUT_TOKEN = "privateauttoken"

VALID_CLIENTS_PORTS = []

async function sendMsg(dst, msg, src) {
    var url = "http://localhost:" + dst + "/msg"

    const response = await axios.post(url, null, {params: {token: PUBLIC_SERVER_TOKEN, port: src, msg: msg}})
    .then((response) => {
        console.log(`msg sent to ${dst}`)
    })
    .catch((error) => {
        console.error(error)
    })
}

// ask for a validation token to aut server
app.get("/gettoken", (req, res) => {
    let key = req.query.key
    let port = req.query.port
    
    var url = "http://localhost:3001/gettoken"
    console.log("asking for token, port, key: " + url + " " + port + " " + key)
    axios.get(url, {params: {port: port, key: key, server_token: PRIVATE_SERVER_TOKEN}})
    .then((response) => {
        console.log(`[SERVER] Token received: ${response.data.token}`)
        return res.status(200).json({ token: response.data.token})
    })
    .catch((error) => {
        console.error(error)
    })
})

async function isClientAuthenticated(token, port) {
    var url = "http://localhost:3001/auth"
    const response = await axios.get(url, {params: {token: token, port: port, server_token: PRIVATE_SERVER_TOKEN}})
    .then((response) => {
        console.log(`Client is authenticated - ${response.data.auth}`)
        return response.data.token
    })
    .catch((error) => {
        console.error(error)
    })
}

// update client list based on tokens
app.post("/clients", (req, res) => {
    let aut_token = req.query.aut_token
    let valid_ports = req.query.valid_ports

    console.log(`[SERVER] Updating client list`)
    console.log(`[SERVER] Aut token: ${aut_token}`)
    console.log(`[SERVER] Valid ports: ${valid_ports}`)

    // check if aut server is authenticated
    if (aut_token != PRIVATE_AUT_TOKEN) {
        return res.status(404).send("Auth token not valid")
    }

    VALID_CLIENTS_PORTS = valid_ports.split(",")
    console.log(`[SERVER] Updated valid ports: ${VALID_CLIENTS_PORTS}`)
    return res.status(200).send("client list updated")
})

app.post("/msg", (req, res) => {
    let token = req.query.token
    let msg = req.query.msg
    let port = req.query.port

    

    // check if client is authenticated
    let auth = isClientAuthenticated(token, port)
    if (auth == false) {
        return res.status(404).send("[ERROR] - client not authenticated")
    }

    // if authenticated, send msg to all other clients

    for (let i = 0; i < VALID_CLIENTS_PORTS.length; i++) {
        if (VALID_CLIENTS_PORTS[i] != port) {
            //console.log(`sending message to client ${VALID_CLIENTS_PORTS[i]}`)
            sendMsg(VALID_CLIENTS_PORTS[i], msg, port)
        }
    }
    return res.status(200).send("message sent")
    
})



app.listen(port, () => {console.log("Server is running on port: " + port)})

