const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

/**
 * Saves feedback from a user to Firestore.
 * Requires the user to be authenticated.
 */
exports.submitFeedback = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to submit feedback.');
  }

  const { rating, comment, evaluationId } = data;
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    throw new functions.https.HttpsError('invalid-argument', 'Rating must be a number between 1 and 5.');
  }
  if (comment && typeof comment !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Comment must be a string.');
  }
  if (!evaluationId || typeof evaluationId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'A valid evaluationId is required.');
  }


  try {
    const feedbackRef = admin.firestore().collection('feedback').doc(evaluationId);
    
    await feedbackRef.set({
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'N/A',
      rating: rating,
      comment: comment || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: 'Feedback submitted successfully.' };
  } catch (error) {
    console.error("Error saving feedback:", error);
    throw new functions.https.HttpsError('internal', 'Could not save feedback.');
  }
});

/**
 * Returns all feedback for the admin panel.
 * Requires the user to be an admin.
 */
exports.getFeedback = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError('permission-denied', 'You must be an admin to view this list.');
  }

  try {
    const snapshot = await admin.firestore().collection('feedback').orderBy('createdAt', 'desc').get();
    const feedbackList = snapshot.docs.map(doc => {
        const docData = doc.data();
        return {
            id: doc.id,
            ...docData,
            // Convert timestamp to a serializable format (ISO string) for the client
            createdAt: docData.createdAt.toDate().toISOString(),
        };
    });
    return { feedbackList };
  } catch (error) {
    console.error("Error getting feedback:", error);
    throw new functions.https.HttpsError('internal', 'Could not retrieve the feedback list.');
  }
});


// NOTE: Assume other functions like listAllUsers and toggleAdminRole are here.
const stripe = require('stripe')('sk_test_51RZlfLRwyUm5uH9oKkSjJ9GUCjdKZEBFY9sVd8w8gL9pBplK2pgeC44wHhMse8A6T6QzD4f2iPEABG4y1aRcmS1z00Q2YnJ2IL');

exports.createCheckoutSession = functions.https.onRequest(async (req, res) => {
    // Definitive manual CORS handling
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        res.status(204).send('');
        return;
    }
    
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
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
                    unit_amount: 1000, // $10.00
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${req.headers.origin || 'http://localhost:3000'}?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin || 'http://localhost:3000'}?payment_cancelled=true`,
        });

        res.status(200).json({ id: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

exports.listAllUsers = functions.https.onCall(async (data, context) => {
    if (!context.auth?.token?.admin) {
      throw new functions.https.HttpsError('permission-denied', 'You must be an admin to view this list.');
    }
    try {
        const listUsersResult = await admin.auth().listUsers(1000);
        const users = listUsersResult.users.map(userRecord => ({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            isAdmin: !!userRecord.customClaims?.admin,
            isPremium: !!userRecord.customClaims?.premium,
        }));
        return { users };
    } catch (error) {
        console.error('Error listing users:', error);
        throw new functions.https.HttpsError('internal', 'Unable to list users.');
    }
});

exports.toggleUserRole = functions.https.onCall(async (data, context) => {
    if (!context.auth?.token?.admin) {
        throw new functions.https.HttpsError('permission-denied', 'You must be an admin to modify roles.');
    }
    const { uid, role, status } = data;
    if (!uid || typeof status !== 'boolean' || !['admin', 'premium'].includes(role)) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "uid", a "role" (admin/premium), and a "status" boolean.');
    }

    try {
        const user = await admin.auth().getUser(uid);
        const currentClaims = user.customClaims || {};
        const newClaims = { ...currentClaims, [role]: status };

        await admin.auth().setCustomUserClaims(uid, newClaims);
        return { message: `Success! User ${uid}'s ${role} status is now ${status}.` };
    } catch (error) {
        console.error('Error setting custom claims:', error);
        throw new functions.https.HttpsError('internal', 'Unable to set custom claims.');
    }
});


exports.getNearbyOphthalmologistsProxy = functions.https.onRequest(async (req, res) => {
    // Definitive manual CORS handling
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        res.status(204).send('');
        return;
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed. Please use GET.' });
    }

    const { stateCode, cityName } = req.query;
    const limit = req.query.limit || 10;

    if (!stateCode || typeof stateCode !== 'string') {
      return res.status(400).json({ error: 'The function must be called with a "stateCode" query parameter.' });
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
        console.error("NPPES API request failed with status:", nppesResponse.status, "and body:", errorText);
        return res.status(nppesResponse.status).json({ ophthalmologists: [], error: `NPPES API Error: ${errorText}` });
      }

      const apiData = await nppesResponse.json();

      if (!apiData.results || apiData.result_count === 0) {
        return res.status(200).json({ ophthalmologists: [] });
      }

      const results = [];
      const seen = new Set();
      for (const provider of apiData.results) {
        const basicInfo = provider.basic || {};
        let name =
          basicInfo.organization_name?.trim() ||
          `${basicInfo.first_name || ""} ${basicInfo.last_name || ""}`.trim();

        if (!name) name = "Unknown Provider";

        const addresses = provider.addresses || [];
        const addressObj =
          addresses.find(a => ["LOCATION", "PRIMARY"].includes(a.address_purpose)) || addresses[0];

        if (!addressObj) continue;

        const phone = addressObj.telephone_number || "N/A";
        let addressParts = [
          addressObj.address_1,
          addressObj.address_2,
          addressObj.city,
          addressObj.state,
          addressObj.postal_code,
        ];
        let address = addressParts.filter(Boolean).join(', ');

        const uniqueKey = `${name}-${address}`;
        if (seen.has(uniqueKey) || name === 'Unknown Provider') continue;
        seen.add(uniqueKey);

        const taxonomies = provider.taxonomies || [];
        let specialty = "N/A";
        if (taxonomies.length > 0) {
          const primaryTax = taxonomies.find(t => t.primary === true) || taxonomies[0];
          if (primaryTax) specialty = primaryTax.desc || "N/A";
        }

        results.push({ name, specialty, address, phone });
      }

      return res.status(200).json({ ophthalmologists: results });

    } catch (err) {
      console.error("Internal error in getNearbyOphthalmologistsProxy:", err);
      return res.status(500).json({ error: 'Failed to fetch data from the provider registry due to an internal server error.' });
    }
});