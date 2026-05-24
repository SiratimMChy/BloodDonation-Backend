const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 3000;
const crypto = require('crypto')

const app = express();
app.use(cors());
app.use(express.json());

const { client } = require('./config/db');

// Import routes
const userRoutes = require('./routes/userRoutes');
const requestRoutes = require('./routes/requestRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Use routes
app.use(userRoutes);
app.use(requestRoutes);
app.use(paymentRoutes);

async function run() {
    try {

        //await client.connect();

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