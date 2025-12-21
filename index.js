const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 3000;
const stripe = require('stripe')(process.env.STRIPE_KEY);
const crypto = require('crypto')

const app = express();
app.use(cors());
app.use(express.json());

const admin = require("firebase-admin");
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decoded);


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const verifyFBToken = async (req, res, next) => {
    const token = req.headers.authorization
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    try {
        const idToken = token.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        console.log("Decoded Info:", decodedToken);
        req.decodedEmail = decodedToken.email;
        next();

    } catch (error) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
};


const uri = "mongodb+srv://BloodDonation:FYwt4tKuBeGsB0NH@cluster0.ybtdeyi.mongodb.net/?appName=Cluster0";


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        await client.connect();

        
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

        //await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Blood Donation Backend is running');
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});