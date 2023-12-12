const express = require('express')
const cors = require('cors')
const axios = require('axios')

const app = express()
var port = 3001
app.use(cors())


VALID_TOKENS = []
VALID_KEYS = []
VALID_PORTS = ["3030", "3060"]

BANNED_TOKENS = []
BANNED_KEYS = []
BANNED_PORTS = []


// ask for a validation token to aut server
app.get("/gettoken", (req, res) => {
    let key = req.query.key
    let port = req.query.port
    console.log(`querry key, port: ${key}, ${port}`)

    // check for asker port
    if (!VALID_PORTS.includes(port)) {
        console.log("port not valid")
        return res.status(404).send("port not valid")
    }
    //chech if key is already validated
    if (VALID_KEYS.includes(key)) {
        console.log("key already validated")
        return res.status(404).send("key already validated")
    }

    // generate a token
    let token = Math.random().toString(36).substring(7)
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

    // return token
    return res.status(200).json({ token: token })
})


async function sendMsg(dst, msg, src) {
    var url = "http://localhost:" + dst + "/msg"
    //console.log("Aut server sending msg to: " + url)
    const response = await axios.post(url, null, {params: {port: src, msg: msg}})
    .then((response) => {
        console.log(`msg sent to ${dst}`)
    })
    .catch((error) => {
        console.error(error)
    })
}

app.post("/msg", (req, res) => {
    let token = req.query.token
    let port = req.query.port
    let msg = req.query.msg
    
    console.log(`received querry token, port, msg: ${token}, ${port}, ${msg}`)

    // check if port is valid
    if (!VALID_PORTS.includes(port)) {
        console.log(`port ${port} not valid`)
        return res.status(404).send("port not valid")
    }

    // check if token is valid
    if (!VALID_TOKENS.includes(token)) {
        console.log(`token ${token} not valid`)
        return res.status(404).send("token not valid")
    }

    // send message to all valid clients
    for (let i = 0; i < VALID_TOKENS.length; i++) {
        if (VALID_TOKENS[i] != token) {
            console.log(`sending message to ${VALID_TOKENS[i]} with port ${VALID_PORTS[i]}`)
            // send message to client
            sendMsg(VALID_PORTS[i], msg, port)
            
        }
    }
    return res.status(200).send("msg sent")

})






// for debug
app.get("/", (req, res) => { 
    console.log("Hello World from aut")
    return res.status(200).send("Hello World")
})

// for debug
app.get("/:id", (req, res) => {
    console.log("received params: " + req.params.id)
    return res.status(200)
})

// for debug
app.post("/test", (req, res) => {
    console.log("Hello World from aut")
    return res.status(200).send("Hello World")
})


app.listen(port, () => {console.log("Aut server is running on port: " + port)})

