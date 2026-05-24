const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_KEY);
const { paymentCollection } = require('../config/db');
const verifyFBToken = require('../middleware/verifyFBToken');

        router.post('/create-payment-checkout', async (req, res) => {
            const Info = req.body;
            const amount = parseInt(Info.donateAmount) * 100;
            const session = await stripe.checkout.sessions.create({

                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            unit_amount: amount,
                            product_data: {
                                name: 'please Donate'
                            }
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                metadata: {
                    donorName: Info?.donorName
                },
                customer_email: Info?.donorEmail,
                success_url: `${process.env.SITE_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.SITE_DOMAIN}/payment-cancelled`,
            });

            res.send({ url: session.url })

        });


        router.post('/payment-success', async (req, res) => {
            const { session_id } = req.query;
            const session = await stripe.checkout.sessions.retrieve(
                session_id
            );
            console.log(session);

            const transactionId = session.payment_intent;
            if (session.payment_status == 'paid') {
                const existingPayment = await paymentCollection.findOne({
                    transactionId: session.payment_intent
                });

                if (existingPayment) {
                    return res.send({ message: 'Payment already processed', data: existingPayment });
                }

                const paymentInfo = {
                    donorName: session.metadata?.donorName,
                    amount: session.amount_total / 100,
                    currency: session.currency,
                    donorEmail: session.customer_email,
                    transactionId,
                    payment_status: session.payment_status,
                    paidAt: new Date()
                }

                const result = await paymentCollection.insertOne(paymentInfo)
                return res.send(result);
            }
        })


        router.get('/payment', verifyFBToken, async (req, res) => {
            try {
                const size = parseInt(req.query.size);
                const page = parseInt(req.query.page);
                const result = await paymentCollection
                    .find()
                    .sort({ paidAt: -1 })
                    .limit(size)
                    .skip(size * page)
                    .toArray();

                res.send({ requests: result });
            } catch (error) {
                console.log(error);
                res.status(500).send({
                    success: false,
                    error: 'Failed to fetch payments'
                });
            }
        });

module.exports = router;
