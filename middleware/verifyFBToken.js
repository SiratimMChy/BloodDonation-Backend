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

module.exports = verifyFBToken;
