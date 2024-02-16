const express = require('express')
const cors = require('cors')
const axios = require('axios')

const app = express()
var port = 3001
app.use(cors())

PRIVATE_AUT_TOKEN = "privateauttoken"

PRIVATE_SERVER_TOKEN = "privateservertoken"

VALID_TOKENS = []
VALID_KEYS = []
VALID_PORTS = []

BANNED_TOKENS = []
BANNED_KEYS = []
BANNED_PORTS = []


// ask for a validation token to aut server
app.get("/gettoken", (req, res) => {
    let key = req.query.key
    let port = req.query.port
    let server_token = req.query.server_token
    console.log(`querry key, port: ${key}, ${port}, ${server_token}`)



    // check if key is from server
    if (server_token != PRIVATE_SERVER_TOKEN) {
        console.log("Server key not valid")
        return res.status(404).send("Server key not valid")
    }
    //chech if key is already validated
    if (VALID_KEYS.includes(key)) {
        console.log("key already validated")
        return res.status(404).send("key already validated")
    }
    // check if port is valid 
    if (VALID_PORTS.includes(port)) {
        console.log("port already validated")
        return res.status(404).send("port already validated")
    }
    // check if port is banned
    if (BANNED_PORTS.includes(port) || BANNED_KEYS.includes(key)) {
        console.log("port/key banned")
        return res.status(404).send("port/key banned")
    }
  
    // generate a token
    let token = Math.random().toString(36).substring(7) + key
    console.log("generated token: " + token)

    // add token, key and port to validation list
    VALID_TOKENS.push(token)
    VALID_KEYS.push(key)
    VALID_PORTS.push(port)

    // debug: print all tokens
    console.log("keys: " + VALID_KEYS)
    console.log("tokens: " + VALID_TOKENS)
    console.log("ports: " + VALID_PORTS)
    console.log("\n")

    // update server valid ports
    axios.post("http://localhost:8080/clients", null, 
    {params: {aut_token: PRIVATE_AUT_TOKEN, valid_ports: VALID_PORTS.join(",")}})

    // return token
    return res.status(200).json({ token: token})
})


async function sendMsg(dst, msg, src) {
    
}

app.get("/auth", (req, res) => {
    let token = req.query.token
    let port = req.query.port
    let server_token = req.query.server_token
    console.log(`received querry token, port, server_token: ${token}, ${port}, ${server_token}`)

    // check if server token is valid
    if (server_token != PRIVATE_SERVER_TOKEN) {
        console.log("Server key not valid")
        return res.status(404).send({auth: false})
    }

    // check if token or port is banned
    if (BANNED_TOKENS.includes(token)) {
        console.log(`user with token ${token} banned`)
        return res.status(404).send({auth: false})
    }

    if (BANNED_PORTS.includes(port)) {
        console.log(`user with port ${port} banned`)
        return res.status(404).send({auth: false})
    }

    if (!VALID_PORTS.includes(port) || !VALID_TOKENS.includes(token)) {
        console.log(`user with token ${token} and port ${port} not validated`)
        return res.status(404).send({auth: false})
    }
    
    return res.status(200).send({auth: true})

    
})



app.listen(port, () => {console.log("Aut server is running on port: " + port)})

