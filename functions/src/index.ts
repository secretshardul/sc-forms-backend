import * as functions from "firebase-functions";
import * as express from  "express";
import * as cors from "cors";
import fetch from "node-fetch";
import * as bodyParser from "body-parser";
import * as stream from 'stream';
const Anvil = require('@anvilco/anvil');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const typingDnaUrl = 'https://api.typingdna.com/';
const anvilUrl = 'https://graphql.useanvil.com';

const typeDnaAuth = {
    apiKey: 'fd962860929b8d5a0b59d44f6008cc88',
    apiSecret: '231f0bccb357a737d9f64a95fcc9c2c5',
}

const anvilAuth = {
    apiKey: 'yI1jAMxHeVK3tqERBQFllhTdwzCal9X9',
    apiSecret: ':',
}
const anvilClient = new Anvil({ apiKey: anvilAuth.apiKey });

function basicAuth(key: string, secret: string) {
    return 'Basic ' + Buffer.from(key + ':' + secret).toString('base64');
}
const typeDnaBasic = basicAuth(typeDnaAuth.apiKey, typeDnaAuth.apiSecret);
const anvilBasic = basicAuth(anvilAuth.apiKey, anvilAuth.apiSecret);

// Return true if user exists
app.get('/userPresent/:userId', async (req, res) => {
    const id = req.params.userId
    const response = await fetch(typingDnaUrl + 'user/' + id, {
        headers: {
            Authorization: typeDnaBasic,
        },
    })
    const responseJson = await response.json();
    console.log(responseJson);

    const userPresent = responseJson.count > 0 || responseJson.mobilecount > 0;
    res.send(userPresent);
})

// Save new typing pattern for given user
app.post('/save/:userId', async (req, res) => {
    const id = req.params.userId;
    const tp = req.body.tp;
    console.log('saving pattern', tp)
    console.log('User ID', id)

    try {
        const response = await fetch(typingDnaUrl + 'save/' + id, {
            method: 'POST',
            body: new URLSearchParams({
                tp,
            }),
            headers: {
                Authorization: typeDnaBasic,
            }
        })
        const responseJson = await response.json()
        console.log('got response', responseJson)

        const saveSuccess = (responseJson.success == 1)
        res.send(saveSuccess);
    } catch(error) {
        res.send(error);
    }
})

// Return true if typing pattern is a match for given user
app.post('/verify/:userId', async (req, res) => {
    const id = req.params.userId;
    const tp = req.body.tp;
    console.log('verifying', id)

    const response = await fetch(typingDnaUrl + 'verify/' + id, {
        method: 'POST',
        body: new URLSearchParams({
            tp,
        }),
        headers: {
            Authorization: typeDnaBasic,
        }
    })
    const responseJson = await response.json();
    console.log('verification response', responseJson);

    const matchSuccess = (responseJson.net_score > 50);
    res.send(matchSuccess);
})

app.get('/', (req, res) => {
    res.send('gg');
})

// Return form name and fields
app.get('/form/:eid', async(req, res) => {
    const eid = req.params.eid;
    const query = `query CastQuery($eid: String!) {
      cast(eid: $eid) {
        name
        fieldInfo
      }
    }`

    const response = await fetch(anvilUrl, {
        method: 'POST',
        body: JSON.stringify({
            query,
            variables: { eid },
        }),
        headers: {
            Authorization: anvilBasic,
            "Content-Type": "application/json"
        }
    })
    console.log('Got response', response);
    try {
        const responseJson = await response.json();
        console.log('got form data', responseJson);
        res.send(responseJson.data.cast);
    } catch(error) {
        res.send(error);
    }
})

app.post('/form/:formSlug', async (req, res) => {
    // Get filled PDF
    const formSlug = req.params.formSlug;
    const { statusCode, data } = await anvilClient.fillPDF(formSlug, {
        data: req.body
    })
    console.log('Write status', statusCode)
    console.log('got file', data)

    // Return PDF in response
    var readStream = new stream.PassThrough()
    readStream.end(data)

    res.set('Content-disposition', 'attachment; filename=' + 'output.pdf')
    res.set('Content-Type', 'application/pdf')
    readStream.pipe(res);

})
exports.app = functions.https.onRequest(app);
