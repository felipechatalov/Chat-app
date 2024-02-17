const express = require('express')
const cors = require('cors')

const app = express()
var port = 3001
app.use(cors())

PRIVATE_AUT_TOKEN = "privateauttoken"
PRIVATE_SERVER_TOKEN = "privateservertoken"

VALID_TOKENS = ["5001", "5002", "5003"]

app.get("/auth", (req, res) => {
    let token = req.query.token
    console.log(`received querry token: ${token}`)



    if (!VALID_TOKENS.includes(token)) {
        console.log(`user with token ${token} not authorized`)
        return res.status(404).send({auth: false})
    }
    return res.status(200).send({auth: true})

    
})



app.listen(port, () => {console.log("Aut server is running on port: " + port)})

