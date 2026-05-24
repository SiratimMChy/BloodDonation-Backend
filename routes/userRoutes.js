const express = require('express');
const router = express.Router();
const { usersCollection } = require('../config/db');
const verifyFBToken = require('../middleware/verifyFBToken');

        router.post('/users', async (req, res) => {
            const userInfo = req.body;
            userInfo.createdAt = new Date();
            userInfo.role = 'donor';
            userInfo.status = 'active';
            const result = await usersCollection.insertOne(userInfo);
            res.send(result);

        });




        router.get('/users', verifyFBToken, async (req, res) => {
            try {
                const size = parseInt(req.query.size) || 10;
                const page = parseInt(req.query.page) || 0;

                const result = await usersCollection
                    .find()
                    .sort({ createdAt: -1 })
                    .limit(size)
                    .skip(size * page)
                    .toArray();

                const totalUsers = await usersCollection.countDocuments();

                res.status(200).send({ totalUsers, users: result });
            } catch (error) {
                console.error('Error fetching users:', error);
                res.status(500).send({
                    success: false,
                    error: 'Failed to fetch users'
                });
            }
        });




        router.get('/users/role/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await usersCollection.findOne(query);
            res.send(result);
        });




        router.patch('/update/user/status', verifyFBToken, async (req, res) => {
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

        router.patch('/update/user/role', verifyFBToken, async (req, res) => {
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

        router.patch('/users/update/profile', verifyFBToken, async (req, res) => {
            const email = req.decodedEmail;
            const query = { email: email };
            const { name, imageUrl, district, upazila, bloodGroup } = req.body;

            const updateProfile = {
                $set: {
                    name: name,
                    imageUrl: imageUrl,
                    district: district,
                    upazila: upazila,
                    bloodGroup: bloodGroup,
                    updatedAt: new Date()
                }
            };
            const result = await usersCollection.updateOne(query, updateProfile);
            res.send(result);
        });




        // Update your backend endpoint - remove verifyFBToken for demo users
        router.get('/demo-users', async (req, res) => {
            try {
                const demoEmails = ['donor@hemovia.com', 'admin@hemovia.com'];
                const demoUsers = await usersCollection.find({
                    email: { $in: demoEmails }
                }).toArray();

                if (!demoUsers || demoUsers.length === 0) {
                    return res.status(404).json({
                        message: 'Demo users not found',
                        users: []
                    });
                }

                const demoUsersData = demoUsers.map(user => ({
                    _id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    bloodGroup: user.bloodGroup,
                    district: user.district,
                    upazila: user.upazila,
                    imageUrl: user.imageUrl,
                    status: user.status
                }));

                res.status(200).json({
                    success: true,
                    users: demoUsersData
                });
            } catch (error) {
                console.error('Error fetching demo users:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to fetch demo users'
                });
            }
        });

module.exports = router;
