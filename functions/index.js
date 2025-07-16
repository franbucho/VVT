const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const stripe = require('stripe')('sk_test_51RZlfLRwyUm5uH9oKkSjJ9GUCjdKZEBFY9sVd8w8gL9pBplK2pgeC44wHhMse8A6T6QzD4f2iPEABG4y1aRcmS1z00Q2YnJ2IL');

admin.initializeApp();

const handleRequest = (handler) => functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.set('Access-Control-Max-Age', '3600');
        return res.status(204).send('');
    }
    return handler(req, res);
});

const authenticateUser = async (req) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        throw new functions.https.HttpsError('unauthenticated', 'Unauthorized: No token provided.');
    }
    const idToken = req.headers.authorization.split('Bearer ')[1];
    try {
        return await admin.auth().verifyIdToken(idToken);
    } catch (error) {
        console.error("Error verifying token", error);
        throw new functions.https.HttpsError('unauthenticated', 'Unauthorized: Invalid token.');
    }
};

exports.submitFeedback = handleRequest(async (req, res) => {
    try {
        const decodedToken = await authenticateUser(req);
        const { rating, comment, evaluationId } = req.body;

        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be a number between 1 and 5.' });
        }
        if (comment && typeof comment !== 'string') {
            return res.status(400).json({ error: 'Comment must be a string.' });
        }
        if (!evaluationId || typeof evaluationId !== 'string') {
            return res.status(400).json({ error: 'A valid evaluationId is required.' });
        }

        const feedbackRef = admin.firestore().collection('feedback').doc(evaluationId);
        await feedbackRef.set({
            userId: decodedToken.uid,
            userEmail: decodedToken.email || 'N/A',
            rating,
            comment: comment || '',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return res.status(200).json({ success: true, message: 'Feedback submitted successfully.' });
    } catch (error) {
        console.error("Error saving feedback:", error);
        const status = error.code === 'unauthenticated' ? 403 : 500;
        return res.status(status).json({ error: error.message || 'Could not save feedback.' });
    }
});

exports.getFeedback = handleRequest(async (req, res) => {
    try {
        const decodedToken = await authenticateUser(req);
        if (!decodedToken.admin) {
            throw new functions.https.HttpsError('permission-denied', 'Permission denied: User is not an admin.');
        }

        const snapshot = await admin.firestore().collection('feedback').orderBy('createdAt', 'desc').get();
        const feedbackList = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate().toISOString() || null,
            };
        });

        return res.status(200).json({ feedbackList });
    } catch (error) {
        console.error("Error getting feedback:", error);
        const status = ['unauthenticated', 'permission-denied'].includes(error.code) ? 403 : 500;
        return res.status(status).json({ error: error.message || 'Could not retrieve feedback.' });
    }
});

exports.createCheckoutSession = handleRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Virtual Vision Test Analysis',
                        description: 'One-time payment for a detailed AI eye health analysis report.',
                    },
                    unit_amount: 1000,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${req.headers.origin || 'http://localhost:3000'}?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin || 'http://localhost:3000'}?payment_cancelled=true`,
        });

        return res.status(200).json({ id: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

exports.listAllUsers = handleRequest(async (req, res) => {
    try {
        const decodedToken = await authenticateUser(req);
        if (!decodedToken.admin) {
            throw new functions.https.HttpsError('permission-denied', 'Permission denied: User is not an admin.');
        }

        const listUsersResult = await admin.auth().listUsers(1000);
        const users = listUsersResult.users.map(user => ({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            isAdmin: !!user.customClaims?.admin,
            isPremium: !!user.customClaims?.premium,
        }));

        return res.status(200).json({ users });
    } catch (error) {
        console.error('Error listing users:', error);
        const status = ['unauthenticated', 'permission-denied'].includes(error.code) ? 403 : 500;
        return res.status(status).json({ error: error.message || 'Unable to list users.' });
    }
});

exports.toggleUserRole = handleRequest(async (req, res) => {
    try {
        const decodedToken = await authenticateUser(req);
        if (!decodedToken.admin) {
            throw new functions.https.HttpsError('permission-denied', 'Permission denied: User is not an admin.');
        }

        const { uid, role, status } = req.body;
        if (!uid || typeof status !== 'boolean' || !['admin', 'premium'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role or missing parameters.' });
        }
        if (decodedToken.uid === uid && role === 'admin' && !status) {
            return res.status(400).json({ error: 'Admins cannot remove their own admin status.' });
        }

        const user = await admin.auth().getUser(uid);
        const currentClaims = user.customClaims || {};
        const newClaims = { ...currentClaims, [role]: status };

        await admin.auth().setCustomUserClaims(uid, newClaims);
        return res.status(200).json({ message: `User ${uid}'s ${role} status updated to ${status}` });
    } catch (error) {
        console.error('Error setting user role:', error);
        const status = ['unauthenticated', 'permission-denied'].includes(error.code) ? 403 : 500;
        return res.status(status).json({ error: error.message || 'Unable to set user role.' });
    }
});

exports.getNearbyOphthalmologistsProxy = handleRequest(async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed. Please use GET.' });
    }

    const { stateCode, cityName } = req.query;
    const limit = req.query.limit || 10;

    if (!stateCode || typeof stateCode !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "stateCode" parameter.' });
    }

    const apiUrl = "https://npiregistry.cms.hhs.gov/api/?version=2.1";
    const params = new URLSearchParams({
        enumeration_type: "NPI-2",
        taxonomy_description: "Ophthalmology",
        limit: limit.toString(),
        state: stateCode.toUpperCase(),
    });

    if (cityName && typeof cityName === 'string' && cityName.trim()) {
        params.append('city', cityName.toUpperCase());
    }

    try {
        const nppesApiUrl = `${apiUrl}&${params.toString()}`;
        const nppesResponse = await fetch(nppesApiUrl);

        if (!nppesResponse.ok) {
            const errorText = await nppesResponse.text();
            console.error("NPPES API failed:", nppesResponse.status, errorText);
            return res.status(nppesResponse.status).json({ ophthalmologists: [], error: `NPPES API Error: ${errorText}` });
        }

        const apiData = await nppesResponse.json();
        const results = [];

        const seen = new Set();

        for (const provider of apiData.results || []) {
            const basic = provider.basic || {};
            let name = basic.organization_name?.trim() ||
                       `${basic.first_name || ''} ${basic.last_name || ''}`.trim() || 'Unknown Provider';

            const addressObj = (provider.addresses || []).find(a => ["LOCATION", "PRIMARY"].includes(a.address_purpose)) || provider.addresses?.[0];
            if (!addressObj) continue;

            const phone = addressObj.telephone_number || "N/A";
            const address = [addressObj.address_1, addressObj.address_2, addressObj.city, addressObj.state, addressObj.postal_code].filter(Boolean).join(', ');

            const uniqueKey = `${name}-${address}`;
            if (seen.has(uniqueKey) || name === 'Unknown Provider') continue;
            seen.add(uniqueKey);

            const specialty = provider.taxonomies?.find(t => t.primary)?.desc || provider.taxonomies?.[0]?.desc || "N/A";

            results.push({ name, specialty, address, phone });
        }

        return res.status(200).json({ ophthalmologists: results });

    } catch (error) {
        console.error("Internal error in proxy:", error);
        return res.status(500).json({ error: 'Internal error while fetching ophthalmologists.' });
    }
});
