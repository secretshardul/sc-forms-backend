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

const typingDnaUrl = 'https://api.typingdna.com/user/';
const anvilUrl = 'https://graphql.useanvil.com';

const typeDnaAuth = {
    apiKey: 'fd962860929b8d5a0b59d44f6008cc88',
    apiSecret: '231f0bccb357a737d9f64a95fcc9c2c5',
}

const anvilAuth = {
    apiKey: 'yI1jAMxHeVK3tqERBQFllhTdwzCal9X9',
    apiSecret: '',
}
const anvilClient = new Anvil({ apiKey: anvilAuth.apiKey })

function getBasicAuthHeaders(key: string, secret: string) {
    return {
        "Content-Type": "application/json",
        Authorization: 'basic ' + Buffer.from(
            typeDnaAuth.apiKey + ':' + typeDnaAuth.apiSecret
            ).toString('base64'),
    }
}

const typeDnaHeaders = getBasicAuthHeaders(typeDnaAuth.apiKey, typeDnaAuth.apiSecret);
const anvilHeaders = getBasicAuthHeaders(anvilAuth.apiKey, anvilAuth.apiSecret);

// Return true if user exists
app.get('/userPresent/:userId', async (req, res) => {
    const id = req.params.userId
    const response = await fetch(typingDnaUrl + id, {
        headers: typeDnaHeaders,
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

    const response = await fetch(typingDnaUrl + id, {
        headers: typeDnaHeaders,
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

// Return true if typing pattern is a match for given user
app.post('/verify/:userId', async (req, res) => {
    const id = req.params.userId;
    const tp = req.body.tp;
    console.log('verifying', id)

    const response = await fetch(typingDnaUrl + id, {
        headers: typeDnaHeaders,
        method: 'POST',
        body: new URLSearchParams({
            tp,
        }),
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
app.get('/form/:formSlug', async(req, res) => {
    const formSlug = req.params.formSlug;
    const query = `query getFormFields($organizationSlug: String!, $eidOrSlug: String!) {
        forge(organizationSlug: $organizationSlug, eidOrSlug: $eidOrSlug) {
            name
            config
        }
    }`
    const variables = {
         organizationSlug: "gamepe-app",
         eidOrSlug: formSlug
    }
    console.log(anvilHeaders);
    const response = await fetch(anvilUrl, {
        method: 'POST',
        body: JSON.stringify({
            query,
            variables,
        }),
        headers: anvilHeaders,
    })
    try {
        const responseJson = await response.json();
        console.log('got form data', responseJson);
        res.send(responseJson.data.forge);
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
