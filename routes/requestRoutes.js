const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { requestsCollection, usersCollection } = require('../config/db');
const verifyFBToken = require('../middleware/verifyFBToken');

        router.post('/requests', verifyFBToken, async (req, res) => {
            const requestInfo = req.body;
            requestInfo.createdAt = new Date();
            const result = await requestsCollection.insertOne(requestInfo);
            res.send(result);
        });

        router.get('/requests', verifyFBToken, async (req, res) => {
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


        router.get('/my-recent-requests', verifyFBToken, async (req, res) => {
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

        router.get('/myrequests', verifyFBToken, async (req, res) => {
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

        router.get('/requests/:id', verifyFBToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await requestsCollection.findOne(query);

            if (!result) {
                return res.status(404).send({ message: 'Request not found' });
            }

            res.send(result);
        });


        router.put('/requests/:id', verifyFBToken, async (req, res) => {
            const data = req.body;
            const { id } = req.params;
            const query = { _id: new ObjectId(id) };
            const updatedRequest = { $set: data };
            const result = await requestsCollection.updateOne(query, updatedRequest);
            res.send(result);
        });


        router.delete('/delete-request/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const query = { _id: new ObjectId(id) };
                const result = await requestsCollection.deleteOne(query);
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });

        router.get('/public-requests', async (req, res) => {
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

        router.get('/public-stats', async (req, res) => {
            try {
                const totalDonors = await usersCollection.countDocuments({ role: 'donor' });
                const allRequests = await requestsCollection.countDocuments();
                const doneRequests = await requestsCollection.countDocuments({
                    donation_status: 'done'
                });
                const totalRequests = await requestsCollection.countDocuments({
                    donation_status: { $ne: 'done' }
                });
                const successRate = allRequests > 0
                    ? Math.round((doneRequests / allRequests) * 100)
                    : 0;
                const bloodStats = await requestsCollection.aggregate([
                    { $match: { donation_status: { $ne: 'done' } } },
                    { $group: { _id: '$bloodGroup', count: { $sum: 1 } } }
                ]).toArray();
                const bloodTypeCounts = {};
                bloodStats.forEach(item => bloodTypeCounts[item._id] = item.count);
                res.send({ totalDonors, totalRequests, successRate, bloodTypeCounts });
            } catch (error) {
                res.status(500).send({ message: 'Failed to load stats' });
            }
        });

        router.get('/search-request', async (req, res) => {
            const { bloodGroup, district, upazila } = req.query;

            const query = {};
            if (!query) {
                return;
            }
            if (bloodGroup) {
                query.bloodGroup = bloodGroup;
            }
            if (district) {
                query.recipientDistrict = district;
            }
            if (upazila) {
                query.recipientUpazila = upazila;
            }
            const result = await requestsCollection.find(query).toArray();
            res.send(result)

        });

        router.get('/request-message-stats', async (req, res) => {
            try {

                const emergencyCases = await requestsCollection.countDocuments({
                    requestMessage: {
                        $regex: /(emergency|urgent|critical|heart|delivery|accident|life[-\s]?threat|cardiac|myocardial|pregnancy|childbirth)/i
                    }
                });

                const surgeriesEnabled = await requestsCollection.countDocuments({
                    requestMessage: {
                        $regex: /(surgery|operation|transfusion|procedure|hospitalized|cesarean|c-section)/i
                    }
                });


                const familiesHelped = await requestsCollection.countDocuments({
                    donation_status: 'done'
                });

                res.send({
                    emergencyCases,
                    surgeriesEnabled,
                    familiesHelped
                });
            } catch (error) {
                console.error('Stats fetch error:', error);
                res.status(500).send({ message: 'Failed to load request message stats' });
            }
        });

module.exports = router;
