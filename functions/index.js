const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// --- Existing Functions (Stubs for context) ---
// It's assumed functions like createCheckoutSession, listAllUsers, and toggleAdminRole exist here.

/**
 * Saves feedback from a user to Firestore.
 * Requires the user to be authenticated.
 */
exports.submitFeedback = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to submit feedback.');
  }

  const { rating, comment } = data;
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    throw new functions.https.HttpsError('invalid-argument', 'Rating must be a number between 1 and 5.');
  }
  if (comment && typeof comment !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Comment must be a string.');
  }

  try {
    await admin.firestore().collection('feedback').add({
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
// For example:
exports.listAllUsers = functions.https.onCall(async (data, context) => {
  // ... implementation
});

exports.toggleAdminRole = functions.https.onCall(async (data, context) => {
  // ... implementation
});

exports.createCheckoutSession = functions.https.onRequest(async (req, res) => {
    // ... implementation
});
