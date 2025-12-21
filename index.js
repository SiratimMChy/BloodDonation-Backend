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
        const database = client.db('bloodDonationDB');
        const usersCollection = database.collection('users');
        const requestsCollection = database.collection('requests');
        const paymentCollection = database.collection('payments')

        app.post('/users', async (req, res) => {
            const userInfo = req.body;
            userInfo.createdAt = new Date();
            userInfo.role = 'Donor';
            userInfo.status = 'Active';
            const result = await usersCollection.insertOne(userInfo);
            res.send(result);

        });


        app.get('/users', verifyFBToken, async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.status(200).send(result);
        });



        app.post('/requests', verifyFBToken, async (req, res) => {
            const requestInfo = req.body;
            requestInfo.createdAt = new Date();
            const result = await requestsCollection.insertOne(requestInfo);
            res.send(result);
        });

        app.get('/requests', verifyFBToken, async (req, res) => {
            const size = parseInt(req.query.size);
            const page = parseInt(req.query.page);
            const status = req.query.status;
            const query = {};
            if (status && status !== 'all') {
                query.donation_status = status;
            }

            const result = await requestsCollection
                .find(query)
                .limit(size)
                .skip(size * page)
                .toArray();
            const totalRequests = await requestsCollection.countDocuments(query);
            res.send({ totalRequests, requests: result });
        });

        app.get('/my-recent-requests', verifyFBToken, async (req, res) => {
            try {
                const email = req.decodedEmail;
                const result = await requestsCollection
                    .find({ requesterEmail: email })
                    .sort({ createdAt: -1 })
                    .limit(3)
                    .toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });

        app.get('/users/role/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await usersCollection.findOne(query);
            res.send(result);
        });

        app.get('/myrequests', verifyFBToken, async (req, res) => {
            const email = req.decodedEmail;
            const size = parseInt(req.query.size);
            const page = parseInt(req.query.page);
            const query = { requesterEmail: email };
            const status = req.query.status;
            if (status && status !== 'all') {
                query.donation_status = status;
            }
            const result = await requestsCollection
                .find(query)
                .limit(size)
                .skip(size * page)
                .toArray();
            const totalRequests = await requestsCollection.countDocuments(query);
            res.send({ totalRequests, requests: result });
        });

 app.patch('/update/user/status', verifyFBToken, async (req, res) => {
            const { email, status } = req.query;
            const query = { email: email };
            const updateStatus = {
                $set: {
                    status: status
                },
            };
            const result = await usersCollection.updateOne(query, updateStatus);
            res.send(result);
        });

app.patch('/update/user/role', verifyFBToken, async (req, res) => {
            const { email, role } = req.query;
            const query = { email: email };
            const updateRole = {
                $set: {
                    role: role
                },
            };
            const result = await usersCollection.updateOne(query, updateRole);
            res.send(result);
        });






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