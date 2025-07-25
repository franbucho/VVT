'use strict';

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const fetch = require("node-fetch");
admin.initializeApp();

const SUPER_ADMIN_EMAIL = "franciscovillahermosa@gmail.com";
const NPPES_API_URL = "https://npiregistry.cms.hhs.gov/api/";

// Auto assign super admin role on user creation.
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  if (user.email === SUPER_ADMIN_EMAIL) {
    try {
      await admin.auth().setCustomUserClaims(user.uid, { admin: true });
      console.log(`Super admin role assigned to: ${user.email}`);
    } catch (error) {
      console.error("Error assigning super admin role:", error);
    }
  }
});

/**
 * Verifies the Firebase ID token and required roles.
 * @param {functions.https.Request} req The request object.
 * @param {string[]} requiredRoles An array of roles to check, e.g., ['admin', 'doctor'].
 * @return {Promise<{decodedToken: admin.auth.DecodedIdToken | null, error: string | null}>}
 */
const verifyTokenAndRoles = async (req, requiredRoles = []) => {
    const idToken = (req.headers.authorization || '').split('Bearer ')[1];
    if (!idToken) {
        return { decodedToken: null, error: 'unauthenticated' };
    }
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        if (requiredRoles.length > 0) {
            const hasRole = requiredRoles.some(role => !!decodedToken[role]);
            if (!hasRole) {
                return { decodedToken, error: 'permission-denied' };
            }
        }
        return { decodedToken, error: null };
    } catch (error) {
        console.error("Token verification failed:", error);
        return { decodedToken: null, error: 'token-expired' };
    }
};

// Toggle user roles (admin, premium, doctor, hr_admin)
exports.toggleUserRole = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { return res.status(405).send('Method Not Allowed'); }
    try {
      const { decodedToken, error } = await verifyTokenAndRoles(req, ['admin']);
      if (error) { return res.status(403).json({ error: 'Not authorized' }); }

      const { uid, role, status } = req.body;
      const validRoles = ['admin', 'premium', 'doctor', 'hr_admin'];
      if (!uid || typeof role !== 'string' || !validRoles.includes(role) || typeof status !== 'boolean') {
        return res.status(400).json({ error: 'UID, a valid role, and status are required.' });
      }
      if (decodedToken.uid === uid && role === 'admin' && !status) {
        return res.status(400).json({ error: 'You cannot remove your own admin role.' });
      }

      const user = await admin.auth().getUser(uid);
      const updatedClaims = { ...user.customClaims, [role]: status };
      await admin.auth().setCustomUserClaims(uid, updatedClaims);
      return res.status(200).json({ message: `Role ${role} updated to ${status} for user ${uid}` });
    } catch (error) {
      console.error("Error updating role:", error);
      return res.status(500).json({ error: 'Could not update role.' });
    }
  });
});

exports.approveDoctorRequest = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') { return res.status(405).send('Method Not Allowed'); }
        try {
            const { decodedToken, error } = await verifyTokenAndRoles(req, ['admin']);
            if (error) { return res.status(403).json({ error: 'Not authorized' }); }

            const { uid } = req.body;
            if (!uid) {
                return res.status(400).json({ error: 'User ID is required.' });
            }

            const user = await admin.auth().getUser(uid);
            const updatedClaims = { ...user.customClaims, doctor: true };
            await admin.auth().setCustomUserClaims(uid, updatedClaims);

            await admin.firestore().collection('users').doc(uid).update({
                isRequestingDoctorRole: false
            });

            return res.status(200).json({ message: `Doctor request for user ${uid} approved.` });
        } catch (error) {
            console.error("Error approving doctor request:", error);
            return res.status(500).json({ error: 'Could not approve doctor request.' });
        }
    });
});


// Admin: Assign a team to a user
exports.assignTeamToUser = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed.' });
        try {
            const { error } = await verifyTokenAndRoles(req, ['admin']);
            if (error) { return res.status(403).json({ error: 'Not authorized.' }); }
            const { userId, teamId } = req.body;
            if (!userId) return res.status(400).json({ error: 'User ID is required.' });

            await admin.firestore().collection('users').doc(userId).set({
                teamId: teamId || null
            }, { merge: true });
            
            return res.status(200).json({ success: true, message: `User ${userId} assigned to team ${teamId}` });
        } catch (err) {
            console.error("Error assigning team to user:", err);
            return res.status(500).json({ error: "Internal server error." });
        }
    });
});

// List all users for the admin panel
exports.listAllUsers = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { return res.status(405).send('Method Not Allowed'); }
    try {
      const { error } = await verifyTokenAndRoles(req, ['admin']);
      if (error) { return res.status(403).json({ error: 'Not authorized' }); }

      const result = await admin.auth().listUsers(1000);
      const usersDocs = await admin.firestore().collection('users').get();
      const usersData = {};
      usersDocs.forEach(doc => { usersData[doc.id] = doc.data(); });

      const users = result.users.map(user => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'No Name',
        isAdmin: !!user.customClaims?.admin,
        isPremium: !!user.customClaims?.premium,
        isDoctor: !!user.customClaims?.doctor,
        isHrAdmin: !!user.customClaims?.hr_admin,
        isRequestingDoctorRole: usersData[user.uid]?.isRequestingDoctorRole || false,
        teamId: usersData[user.uid]?.teamId || null,
      }));
      return res.status(200).json({ users });
    } catch (error) {
      console.error("Error listing users:", error);
      return res.status(500).json({ error: 'Error getting users.' });
    }
  });
});

// Get statistics for the admin dashboard
exports.getAdminDashboardStats = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
        if (req.method !== 'GET') { return res.status(405).send('Method Not Allowed'); }
        try {
            const { error } = await verifyTokenAndRoles(req, ['admin']);
            if (error) { return res.status(403).json({ error: 'Not authorized' }); }
            
            const listUsersResult = await admin.auth().listUsers(1000);
            let adminCount = 0, premiumCount = 0, doctorCount = 0, hrAdminCount = 0, normalUserCount = 0;

            listUsersResult.users.forEach(user => {
                const claims = user.customClaims || {};
                if (claims.admin) adminCount++;
                if (claims.premium) premiumCount++;
                if (claims.doctor) doctorCount++;
                if (claims.hr_admin) hrAdminCount++;
                if (!claims.admin && !claims.doctor && !claims.hr_admin) {
                    normalUserCount++;
                }
            });
            const evaluationsSnapshot = await admin.firestore().collection('evaluations').count().get();
            const stats = {
                totalUsers: listUsersResult.users.length, adminCount, premiumCount, doctorCount,
                hrAdminCount, normalUserCount, totalEvaluations: evaluationsSnapshot.data().count,
            };
            return res.status(200).json(stats);
        } catch (error) {
            console.error("Error getting dashboard stats:", error);
            return res.status(500).json({ error: 'Error getting stats.' });
        }
    });
});

// Get daily activity data for the admin chart
exports.getAdminDashboardChartData = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'GET') { return res.status(405).send('Method Not Allowed'); }
        try {
            const { error } = await verifyTokenAndRoles(req, ['admin']);
            if (error) { return res.status(403).json({ error: 'Not authorized' }); }

            const chartData = [];
            const today = new Date();
            today.setHours(23, 59, 59, 999);

            for (let i = 6; i >= 0; i--) {
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() - i);
                const startOfDay = new Date(targetDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(targetDate);
                endOfDay.setHours(23, 59, 59, 999);
                const dateLabel = startOfDay.toISOString().split('T')[0];

                const usersSnapshot = await admin.firestore().collection('users')
                    .where('createdAt', '>=', startOfDay)
                    .where('createdAt', '<=', endOfDay)
                    .count().get();
                const evaluationsSnapshot = await admin.firestore().collection('evaluations')
                    .where('createdAt', '>=', startOfDay)
                    .where('createdAt', '<=', endOfDay)
                    .count().get();

                chartData.push({
                    date: dateLabel,
                    newUsers: usersSnapshot.data().count,
                    evaluations: evaluationsSnapshot.data().count,
                });
            }
            return res.status(200).json({ chartData });
        } catch (error) {
            console.error("Error getting chart data:", error);
            return res.status(500).json({ error: 'Error getting chart data.' });
        }
    });
});

// Create a Stripe checkout session
exports.createCheckoutSession = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { return res.status(405).send("Method Not Allowed"); }
    const stripe = require("stripe")(functions.config().stripe.secret_key);
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: "Eye Health Analysis - Niria" },
            unit_amount: 1000,
          }, quantity: 1,
        }],
        mode: "payment",
        success_url: "https://niria-ai-eye-health-analysis-286869624215.us-west1.run.app/?payment_success=true",
        cancel_url: "https://niria-ai-eye-health-analysis-286869624215.us-west1.run.app/?payment_cancelled=true",
      });
      return res.status(200).json({ id: session.id });
    } catch (error) {
      console.error("Error creating Stripe session:", error);
      return res.status(500).json({ error: error.message });
    }
  });
});

// Submit user feedback
exports.submitFeedback = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { return res.status(405).send('Method Not Allowed'); }
    try {
      const { decodedToken, error } = await verifyTokenAndRoles(req);
      if (error) { return res.status(401).json({ error: 'Authentication required' }); }

      const { rating, comment, evaluationId } = req.body;
      await admin.firestore().collection('feedback').add({
        userId: decodedToken.uid, userEmail: decodedToken.email,
        rating, comment, evaluationId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.status(200).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Get all feedback for the admin panel
exports.getFeedback = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== "GET") { return res.status(405).send("Method Not Allowed"); }
    try {
      const { error } = await verifyTokenAndRoles(req, ['admin']);
      if (error) { return res.status(403).json({ error: 'Not authorized' }); }
      const snapshot = await admin.firestore().collection('feedback').orderBy('createdAt', 'desc').get();
      const feedbackList = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id, ...data,
                createdAt: data.createdAt?.toDate().toISOString() || null,
            };
        });
      return res.status(200).json({ feedbackList });
    } catch (error) {
        console.error("Error getting feedback:", error);
        return res.status(500).json({ error: 'Error getting feedback.' });
    }
  });
});

// Doctor: Add a note to an evaluation
exports.addDoctorNote = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed.' });
        }
        try {
            const { decodedToken, error } = await verifyTokenAndRoles(req, ['doctor']);
            if (error) {
                return res.status(403).json({ error: 'Not authorized for this action.' });
            }

            const { evaluationId, noteText } = req.body;
            if (!evaluationId || !noteText) {
                return res.status(400).json({ error: 'Evaluation ID and note text are required.' });
            }

            const note = {
                text: noteText,
                doctorId: decodedToken.uid,
                doctorName: decodedToken.name || decodedToken.email || 'Unknown Doctor',
                createdAt: admin.firestore.Timestamp.now(),
            };

            await admin.firestore().collection('evaluations').doc(evaluationId).update({
                doctorNotes: admin.firestore.FieldValue.arrayUnion(note),
                status: 'responded',
                respondedBy: decodedToken.uid,
                respondedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return res.status(200).json({ success: true, message: 'Note added successfully.' });
        } catch (err) {
            console.error("Error adding doctor note:", err);
            return res.status(500).json({ error: "Internal error adding note" });
        }
    });
});

// Doctor: List all evaluations
exports.listAllEvaluations = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'GET') { return res.status(405).json({ error: 'Method Not Allowed.' }); }
        try {
            const { error } = await verifyTokenAndRoles(req, ['doctor']);
            if (error) { return res.status(403).json({ error: 'Not authorized for this action.' }); }

            const snapshot = await admin.firestore().collection('evaluations').orderBy('createdAt', 'desc').get();
            const evaluations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            return res.status(200).json({ evaluations });
        } catch (err) {
            console.error('Error listing all evaluations:', err);
            return res.status(500).json({ error: 'Internal server error.' });
        }
    });
});

// User: Update their own profile
exports.updateUserProfile = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
        if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed.' }); }
        try {
            const { decodedToken, error } = await verifyTokenAndRoles(req);
            if (error) { return res.status(403).json({ error: 'Not authorized.' }); }
            
            const { profileData } = req.body;
            if (!profileData) { return res.status(400).json({ error: 'Profile data is required.' }); }
            
            const allowedFields = ['firstName', 'lastName', 'photoURL', 'phoneNumber', 'medicalHistory', 'assignedDoctor', 'nextConsultation', 'enableReminders'];
            const updateData = {};
            
            for (const key of Object.keys(profileData)) {
                if (allowedFields.includes(key)) {
                    updateData[key] = profileData[key];
                }
            }
            if (profileData.firstName || profileData.lastName) {
                updateData.displayName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim();
            }
            if (updateData.nextConsultation && typeof updateData.nextConsultation === 'string') {
                 updateData.nextConsultation = admin.firestore.Timestamp.fromDate(new Date(updateData.nextConsultation));
            } else if (updateData.nextConsultation && updateData.nextConsultation._seconds) {
                 updateData.nextConsultation = new admin.firestore.Timestamp(updateData.nextConsultation._seconds, updateData.nextConsultation._nanoseconds);
            }

            await admin.firestore().collection('users').doc(decodedToken.uid).set(updateData, { merge: true });

            const authUpdatePayload = {};
            if(updateData.displayName) authUpdatePayload.displayName = updateData.displayName;
            if(updateData.photoURL) authUpdatePayload.photoURL = updateData.photoURL;
            if (Object.keys(authUpdatePayload).length > 0) {
                 await admin.auth().updateUser(decodedToken.uid, authUpdatePayload);
            }

            return res.status(200).json({ success: true, message: 'Profile updated successfully.' });
        } catch (err) {
            console.error("Error updating user profile:", err);
            return res.status(500).json({ error: "Internal server error." });
        }
    });
});

// HR Admin: Manage teams (CRUD)
exports.manageTeams = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
        const { decodedToken, error } = await verifyTokenAndRoles(req, ['admin']);
        if (error) { return res.status(403).json({ error: 'Not authorized for this action.' }); }

        const teamsCollection = admin.firestore().collection('teams');
        try {
            switch (req.method) {
                case 'GET':
                    const snapshot = await teamsCollection.orderBy('createdAt', 'desc').get();
                    const teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    return res.status(200).json(teams);
                case 'POST':
                    const { name } = req.body;
                    if (!name) return res.status(400).json({ error: 'Team name is required.' });
                    const newTeamRef = await teamsCollection.add({ name, createdAt: admin.firestore.FieldValue.serverTimestamp() });
                    return res.status(201).json({ id: newTeamRef.id, name, message: 'Team created successfully.' });
                case 'PUT':
                    const { id, name: newName } = req.body;
                    if (!id || !newName) return res.status(400).json({ error: 'Team ID and new name are required.' });
                    await teamsCollection.doc(id).update({ name: newName });
                    return res.status(200).json({ message: 'Team updated successfully.' });
                default:
                    return res.status(405).json({ error: 'Method Not Allowed.' });
            }
        } catch (err) {
            console.error('Error managing teams:', err);
            return res.status(500).json({ error: 'Internal server error.' });
        }
    });
});

// HR Admin: Manage employees (CRUD)
exports.manageEmployees = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
        const { decodedToken, error } = await verifyTokenAndRoles(req, ['admin', 'hr_admin']);
        if (error) { return res.status(403).json({ error: 'Not authorized for this action.' }); }
        
        const employeesCollection = admin.firestore().collection('employees');
        try {
            const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
            const userTeamId = userDoc.data()?.teamId;

            if (decodedToken.hr_admin && !decodedToken.admin && !userTeamId) {
                 return res.status(403).json({ error: 'HR Admin is not assigned to a team.' });
            }

            switch (req.method) {
                case 'GET':
                    let query = employeesCollection;
                    if (decodedToken.hr_admin && !decodedToken.admin) {
                        query = query.where('teamId', '==', userTeamId);
                    }
                    const snapshot = await query.orderBy('createdAt', 'desc').get();
                    const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    return res.status(200).json(employees);
                case 'POST':
                case 'PUT':
                    const { id, firstName, lastName, email, teamId } = req.body;
                    if (!firstName || !lastName || !email) {
                        return res.status(400).json({ error: 'First name, last name, and email are required.' });
                    }
                    if (decodedToken.hr_admin && !decodedToken.admin && teamId !== userTeamId) {
                        return res.status(403).json({ error: "Cannot assign employee to a different team." });
                    }
                    const data = { firstName, lastName, email, teamId: teamId || null };

                    if (req.method === 'POST') {
                        const newEmployee = await employeesCollection.add({ ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() });
                        return res.status(201).json({ id: newEmployee.id, ...data });
                    } else { // PUT
                        if (!id) return res.status(400).json({ error: 'Employee ID is required for update.' });
                        await employeesCollection.doc(id).update(data);
                        return res.status(200).json({ id, ...data });
                    }
                default:
                    return res.status(405).json({ error: 'Method Not Allowed.' });
            }
        } catch (err) {
            console.error('Error managing employees:', err);
            return res.status(500).json({ error: 'Internal server error.' });
        }
    });
});

// HR Admin: Get dashboard data
exports.getHrDashboardData = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'GET') { return res.status(405).send('Method Not Allowed'); }
        try {
            const { decodedToken, error } = await verifyTokenAndRoles(req, ['hr_admin']);
            if (error) { return res.status(403).json({ error: 'Not authorized' }); }

            const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
            const teamId = userDoc.data()?.teamId;

            if (!teamId) {
                return res.status(200).json({ stats: { totalMembers: 0, pendingCount: 0, dueSoonCount: 0, overdueCount: 0 }, teamMembers: [] });
            }

            const employeesSnapshot = await admin.firestore().collection('employees').where('teamId', '==', teamId).get();
            const employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const employeeUserIds = employees.map(e => e.userId).filter(Boolean);

            let evaluations = [];
            if (employeeUserIds.length > 0) {
                const evaluationsSnapshot = await admin.firestore().collection('evaluations').where('userId', 'in', employeeUserIds).orderBy('createdAt', 'desc').get();
                evaluations = evaluationsSnapshot.docs.map(doc => doc.data());
            }

            const now = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(now.getDate() + 30);

            let pendingCount = 0;
            let dueSoonCount = 0;
            let overdueCount = 0;

            const teamMembers = employees.map(employee => {
                const userEvals = evaluations.filter(e => e.userId === employee.userId);
                const lastEval = userEvals[0] || null;
                const lastEvaluationAt = lastEval ? lastEval.createdAt : null;
                const nextEvaluationAt = lastEval ? new admin.firestore.Timestamp(lastEval.createdAt.seconds + 31536000, lastEval.createdAt.nanoseconds) : null;
                
                let status = 'pending';
                if (lastEvaluationAt) {
                    status = 'ok';
                    if (nextEvaluationAt.toDate() < now) {
                        status = 'overdue';
                        overdueCount++;
                    } else if (nextEvaluationAt.toDate() < thirtyDaysFromNow) {
                        status = 'due_soon';
                        dueSoonCount++;
                    }
                } else {
                    pendingCount++;
                }
                return { ...employee, lastEvaluationAt, nextEvaluationAt, status };
            });

            const stats = { totalMembers: employees.length, pendingCount, dueSoonCount, overdueCount };
            return res.status(200).json({ stats, teamMembers });
        } catch (err) {
            console.error('Error getting HR dashboard data:', err);
            return res.status(500).json({ error: 'Internal server error.' });
        }
    });
});

// Proxy to fetch nearby ophthalmologists from NPPES API
exports.getNearbyOphthalmologistsProxy = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method Not Allowed.' });
        }
        try {
            const { stateCode, cityName, limit = 10 } = req.query;
            if (!stateCode) {
                return res.status(400).json({ error: 'State code is required.' });
            }

            const params = new URLSearchParams({
                version: '2.1',
                taxonomy_description: 'Ophthalmology',
                address_purpose: 'LOCATION',
                state: stateCode,
                limit: limit.toString(),
            });

            if (cityName) {
                params.append('city', cityName);
            }

            const response = await fetch(`${NPPES_API_URL}?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`NPPES API failed with status: ${response.status}`);
            }

            const data = await response.json();
            
            const ophthalmologists = data.results.map(provider => {
                const practiceAddress = provider.addresses.find(addr => addr.address_purpose === 'LOCATION');
                return {
                    name: `${provider.basic.first_name} ${provider.basic.last_name}`,
                    specialty: 'Ophthalmologist',
                    address: practiceAddress ? `${practiceAddress.address_1}, ${practiceAddress.city}, ${practiceAddress.state} ${practiceAddress.postal_code}` : 'Address not available',
                    phone: practiceAddress ? practiceAddress.telephone_number : 'Phone not available'
                };
            });
            
            return res.status(200).json({ ophthalmologists });
        } catch (error) {
            console.error("Error in NPPES proxy:", error);
            return res.status(500).json({ error: 'Failed to fetch ophthalmologist data.' });
        }
    });
});