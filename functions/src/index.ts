import * as functions from "firebase-functions";
import * as express from  "express";
import * as cors from "cors";

const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.send('gg');
})

exports.app = functions.https.onRequest(app);
