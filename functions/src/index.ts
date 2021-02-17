import * as functions from "firebase-functions";
import * as express from  "express";
import * as cors from "cors";
import fetch from "node-fetch";
import * as bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

const apiKey = 'fd962860929b8d5a0b59d44f6008cc88';
const apiSecret = '231f0bccb357a737d9f64a95fcc9c2c5';

const headers =  {
    'Authorization': 'basic ' + Buffer.from(apiKey + ':' + apiSecret).toString('base64'),
}

app.get('/userPresent/:userId', async (req, res) => {
    const id = req.params.userId
    const response = await fetch('https://api.typingdna.com/user/' + id, {
        headers,
    })
    const responseJson = await response.json();
    console.log(responseJson);

    const userPresent = responseJson.count > 0 || responseJson.mobilecount > 0;
    res.send(userPresent);
})

app.post('/save/:userId', async (req, res) => {
    const id = req.params.userId;
    const tp = req.body.tp;

    const response = await fetch('https://api.typingdna.com/save/' + id, {
        headers,
        method: 'POST',
        body: new URLSearchParams({
            tp,
        }),
    })
    const responseJson = await response.json()
    console.log(responseJson);

    const saveSuccess = (responseJson.success == 1);
    res.send(saveSuccess);
})

app.get('/', (req, res) => {
    res.send('gg');
})

exports.app = functions.https.onRequest(app);
