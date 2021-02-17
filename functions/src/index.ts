import * as functions from "firebase-functions";
import * as express from  "express";
import * as cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

const apiKey = 'fd962860929b8d5a0b59d44f6008cc88';
const apiSecret = '231f0bccb357a737d9f64a95fcc9c2c5';

app.get('/userPresent/:userId', async (req, res) => {
    const id = req.params.userId
    const response = await fetch('https://api.typingdna.com/user/' + id, {
        headers: {
            'Authorization': 'basic ' + Buffer.from(apiKey + ':' + apiSecret).toString('base64'),
        },
    })
    const responseJson = await response.json()
    console.log(responseJson)

    const userPresent = responseJson.count > 0 || responseJson.mobilecount > 0
    res.send(userPresent)
})

app.get('/', (req, res) => {
    res.send('gg');
})

exports.app = functions.https.onRequest(app);
