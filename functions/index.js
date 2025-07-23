'use strict';

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const fetch = require("node-fetch");
admin.initializeApp();

const SUPER_ADMIN_EMAIL = "franciscovillahermosa@gmail.com";

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
            // User must have at least one of the required roles
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
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }
    try {
      const { decodedToken, error } = await verifyTokenAndRoles(req, ['admin']);
      if (error) {
        return res.status(403).json({ error: 'Not authorized' });
      }

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

// Admin: Assign a team to a user
exports.assignTeamToUser = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed.' });
        try {
            const { error } = await verifyTokenAndRoles(req, ['admin']);
            if (error) {
                return res.status(403).json({ error: 'Not authorized.' });
            }
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
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }
    try {
      const { error } = await verifyTokenAndRoles(req, ['admin']);
      if (error) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const result = await admin.auth().listUsers(1000);
      const usersDocs = await admin.firestore().collection('users').get();
      const usersData = {};
      usersDocs.forEach(doc => {
          usersData[doc.id] = doc.data();
      });

      const users = result.users.map(user => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'No Name',
        isAdmin: !!user.customClaims?.admin,
        isPremium: !!user.customClaims?.premium,
        isDoctor: !!user.customClaims?.doctor,
        isHrAdmin: !!user.customClaims?.hr_admin,
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
        if (req.method !== 'GET') {
          return res.status(405).send('Method Not Allowed');
        }
        try {
            const { decodedToken, error } = await verifyTokenAndRoles(req, ['admin', 'hr_admin']);
            if (error) {
                return res.status(403).json({ error: 'Not authorized' });
            }
            
            // If HR Admin (and not super admin), scope stats to their team
            if (decodedToken.hr_admin && !decodedToken.admin) {
                const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
                const teamId = userDoc.data()?.teamId;

                if (!teamId) {
                    return res.status(200).json({ totalUsers: 0, totalEvaluations: 0 });
                }

                const employeesSnapshot = await admin.firestore().collection('employees').where('teamId', '==', teamId).get();
                const employeeUserIds = employeesSnapshot.docs
                    .map(doc => doc.data().userId)
                    .filter(Boolean); // Filter out employees not linked to a user account
                
                // Note: a more scalable solution would involve better data modeling or aggregation.
                // This is okay for a smaller number of employees.
                let evaluationsCount = 0;
                if (employeeUserIds.length > 0) {
                    const evaluationsSnapshot = await admin.firestore().collection('evaluations').where('userId', 'in', employeeUserIds).count().get();
                    evaluationsCount = evaluationsSnapshot.data().count;
                }
                
                return res.status(200).json({
                    totalUsers: employeesSnapshot.size,
                    totalEvaluations: evaluationsCount,
                    // Other stats can be scoped here if needed
                });
            }

            // Super Admin stats
            const listUsersResult = await admin.auth().listUsers(1000);
            let adminCount = 0, premiumCount = 0, doctorCount = 0, hrAdminCount = 0, normalUserCount = 0;

            listUsersResult.users.forEach(user => {
                const claims = user.customClaims || {};
                if (claims.admin) { adminCount++; }
                if (claims.premium) premiumCount++;
                if (claims.doctor) { doctorCount++; }
                if (claims.hr_admin) { hrAdminCount++; }
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

// Create a Stripe checkout session
exports.createCheckoutSession = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') {
      return res.status(405).send("Method Not Allowed");
    }
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
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }
    try {
      const { decodedToken, error } = await verifyTokenAndRoles(req);
      if (error) {
        return res.status(401).json({ error: 'Authentication required' });
      }

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
    if (req.method !== "GET") {
      return res.status(405).send("Method Not Allowed");
    }
    try {
      const { error } = await verifyTokenAndRoles(req, ['admin']);
      if (error) {
        return res.status(403).json({ error: 'Not authorized' });
      }
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
      console.error("Getting feedback:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
});

// Proxy for the public NPPES API
exports.getNearbyOphthalmologistsProxy = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
    const { stateCode, cityName } = req.query;
    const limit = req.query.limit || 10;
    if (!stateCode || typeof stateCode !== 'string') return res.status(400).json({ error: '"stateCode" parameter is missing or invalid.' });
    const apiUrl = "https://npiregistry.cms.hhs.gov/api/?version=2.1";
    const params = new URLSearchParams({
      enumeration_type: "NPI-2", taxonomy_description: "Ophthalmology", limit: limit.toString(), state: stateCode.toUpperCase(),
    });
    if (cityName && typeof cityName === 'string' && cityName.trim()) params.append('city', cityName.toUpperCase());
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
        let name = basic.organization_name?.trim() || `${basic.first_name || ''} ${basic.last_name || ''}`.trim() || 'Unknown Provider';
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
      console.error("Error in proxy function:", error);
      return res.status(500).json({ error: 'Internal error searching for ophthalmologists.' });
    }
  });
});

// List all evaluations for doctors or admins
exports.listAllEvaluations = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
    try {
      const { error } = await verifyTokenAndRoles(req, ['admin', 'doctor']);
      if (error) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      const snapshot = await admin.firestore().collection('evaluations').orderBy('createdAt', 'desc').get();
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json({ evaluations: data });
    } catch (error) {
      console.error("Error getting evaluations:", error);
      return res.status(500).json({ error: 'Error getting evaluations' });
    }
  });
});

// Add a doctor's note to an evaluation
exports.addDoctorNote = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    try {
      const { decodedToken, error } = await verifyTokenAndRoles(req, ['admin', 'doctor']);
      if (error) {
        return res.status(403).json({ error: 'Only doctors or admins can add notes.' });
      }
      const { evaluationId, noteText } = req.body;
      if (!evaluationId || !noteText) return res.status(400).json({ error: 'evaluationId and noteText are required' });
      const evaluationRef = admin.firestore().collection('evaluations').doc(evaluationId);
      const docSnapshot = await evaluationRef.get();
      if (!docSnapshot.exists) return res.status(404).json({ error: 'Evaluation not found' });
      const note = {
        text: noteText,
        doctorId: decodedToken.uid,
        doctorName: decodedToken.name || decodedToken.email || 'Dr. Anonymous',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await evaluationRef.update({
        doctorNotes: admin.firestore.FieldValue.arrayUnion(note),
        status: 'responded',
        respondedBy: note.doctorName,
        respondedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error adding note:", error);
      return res.status(500).json({ error: 'Internal error adding note', details: error.message });
    }
  });
});

// HR Admin: Manage teams
exports.manageTeams = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
        try {
            const { decodedToken, error } = await verifyTokenAndRoles(req, ['admin', 'hr_admin']);
            if (error) return res.status(403).json({ error: 'Not authorized.' });

            const teamsRef = admin.firestore().collection('teams');
            switch (req.method) {
                case 'GET': {
                    const snapshot = await teamsRef.orderBy('name').get();
                    const teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    return res.status(200).json(teams);
                }
                case 'POST':
                case 'PUT': {
                    if (!decodedToken.admin) return res.status(403).json({ error: 'Permission denied. Only admins can manage teams.' });
                    const { id, name } = req.body;
                    if (!name) return res.status(400).json({ error: "Name is required" });
                    
                    if (req.method === 'POST') {
                        const newTeam = { name, createdAt: admin.firestore.FieldValue.serverTimestamp() };
                        const docRef = await teamsRef.add(newTeam);
                        return res.status(201).json({ id: docRef.id, ...newTeam });
                    } else { // PUT
                         if (!id) return res.status(400).json({ error: "ID is required for updates" });
                         await teamsRef.doc(id).update({ name });
                         return res.status(200).json({ id, name });
                    }
                }
                default:
                    return res.status(405).send('Method Not Allowed');
            }
        } catch (error) {
            console.error("Error managing teams:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
});

// HR Admin: Manage employees
exports.manageEmployees = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
        try {
            const { decodedToken, error } = await verifyTokenAndRoles(req, ['admin', 'hr_admin']);
            if (error) return res.status(403).json({ error: 'Not authorized.' });

            const employeesRef = admin.firestore().collection('employees');
            
            // Get HR Admin's teamId if they are not a super admin
            let hrAdminTeamId = null;
            if (decodedToken.hr_admin && !decodedToken.admin) {
                const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
                hrAdminTeamId = userDoc.data()?.teamId;
            }

            switch (req.method) {
                case 'GET': {
                    let query = employeesRef;
                    if (hrAdminTeamId) {
                        query = query.where('teamId', '==', hrAdminTeamId);
                    }
                    const snapshot = await query.orderBy('lastName').get();
                    const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    return res.status(200).json(employees);
                }
                case 'POST': {
                    const { firstName, lastName, email, teamId } = req.body;
                    if (!firstName || !lastName || !email) return res.status(400).json({ error: "Missing required fields" });
                    
                    if (hrAdminTeamId && teamId !== hrAdminTeamId) {
                        return res.status(403).json({ error: 'Permission Denied: Cannot add employee to another team.' });
                    }
                    
                    const newEmployee = { firstName, lastName, email, teamId: teamId || null, createdAt: admin.firestore.FieldValue.serverTimestamp() };
                    const docRef = await employeesRef.add(newEmployee);
                    return res.status(201).json({ id: docRef.id, ...newEmployee });
                }
                case 'PUT': {
                    const { id, firstName, lastName, email, teamId } = req.body;
                    if (!id || !firstName || !lastName || !email) return res.status(400).json({ error: "Missing required fields" });

                    if (hrAdminTeamId) {
                        const employeeDoc = await employeesRef.doc(id).get();
                        if (!employeeDoc.exists || employeeDoc.data().teamId !== hrAdminTeamId) {
                            return res.status(403).json({ error: 'Permission denied to edit this employee.' });
                        }
                        if (teamId !== hrAdminTeamId) {
                             return res.status(403).json({ error: 'Cannot move employee to another team.' });
                        }
                    }
                    const updatedData = { firstName, lastName, email, teamId: teamId === '' ? null : teamId };
                    await employeesRef.doc(id).update(updatedData);
                    return res.status(200).json({ id, ...updatedData });
                }
                default:
                    return res.status(405).send('Method Not Allowed');
            }
        } catch (error) {
            console.error("Error managing employees:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
});

exports.getHrDashboardData = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
        if (req.method !== 'GET') { return res.status(405).json({ error: 'Method Not Allowed.' }); }

        try {
            const { decodedToken, error } = await verifyTokenAndRoles(req, ['admin', 'hr_admin']);
            if (error) { return res.status(403).json({ error: 'Not authorized.' }); }

            let teamId = null;
            if (decodedToken.hr_admin && !decodedToken.admin) {
                const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
                teamId = userDoc.data()?.teamId;
                if (!teamId) {
                    return res.status(200).json({
                        stats: { totalMembers: 0, pendingCount: 0, dueSoonCount: 0, overdueCount: 0 },
                        teamMembers: []
                    });
                }
            }

            let employeesQuery = admin.firestore().collection('employees');
            if (teamId) {
                employeesQuery = employeesQuery.where('teamId', '==', teamId);
            }
            const employeesSnapshot = await employeesQuery.get();
            const employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const employeeUserIds = employees.map(emp => emp.userId).filter(Boolean);
            let evaluationsMap = new Map();

            if (employeeUserIds.length > 0) {
                const evaluationsSnapshot = await admin.firestore().collection('evaluations')
                    .where('userId', 'in', employeeUserIds)
                    .orderBy('createdAt', 'desc')
                    .get();

                evaluationsSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (!evaluationsMap.has(data.userId)) {
                        evaluationsMap.set(data.userId, data.createdAt);
                    }
                });
            }

            let pendingCount = 0;
            let dueSoonCount = 0;
            let overdueCount = 0;
            const now = new Date();
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(now.getDate() + 7);

            const teamMembers = employees.map(emp => {
                const lastEvaluationTimestamp = evaluationsMap.get(emp.userId);
                if (lastEvaluationTimestamp) {
                    const lastEvalDate = lastEvaluationTimestamp.toDate();
                    const nextEvalDate = new Date(lastEvalDate);
                    nextEvalDate.setFullYear(lastEvalDate.getFullYear() + 1);

                    let status = 'ok';
                    if (nextEvalDate < now) {
                        status = 'overdue';
                        overdueCount++;
                    } else if (nextEvalDate <= sevenDaysFromNow) {
                        status = 'due_soon';
                        dueSoonCount++;
                    }

                    return { ...emp, lastEvaluationAt: lastEvaluationTimestamp, nextEvaluationAt: admin.firestore.Timestamp.fromDate(nextEvalDate), status };
                } else {
                    pendingCount++;
                    return { ...emp, status: 'pending' };
                }
            });

            const stats = {
                totalMembers: employees.length,
                pendingCount,
                dueSoonCount,
                overdueCount
            };

            return res.status(200).json({ stats, teamMembers });

        } catch (err) {
            console.error("Error fetching HR dashboard data:", err);
            return res.status(500).json({ error: "Internal server error." });
        }
    });
});

exports.updateUserProfile = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }
        try {
            const { decodedToken, error } = await verifyTokenAndRoles(req);
            if (error || !decodedToken) {
                return res.status(403).json({ error: 'Not authorized' });
            }

            const { profileData } = req.body;
            if (!profileData) {
                return res.status(400).json({ error: 'Profile data is required.' });
            }
            
            const userId = decodedToken.uid;

            // Sanitize data
            const allowedFields = ['firstName', 'lastName', 'photoURL', 'phoneNumber', 'medicalHistory', 'assignedDoctor', 'nextConsultation', 'enableReminders'];
            const dataToUpdate = {};
            for (const key of allowedFields) {
                if (profileData[key] !== undefined) {
                     if (key === 'nextConsultation' && profileData[key]) {
                        let date;
                        if (profileData[key]._seconds) {
                             date = new Date(profileData[key]._seconds * 1000);
                        } else {
                             date = new Date(profileData[key]);
                        }
                        dataToUpdate[key] = admin.firestore.Timestamp.fromDate(date);
                    } else {
                        dataToUpdate[key] = profileData[key];
                    }
                }
            }
            
            await admin.firestore().collection('users').doc(userId).set(dataToUpdate, { merge: true });

            return res.status(200).json({ success: true, message: "Profile updated successfully." });
        } catch (error) {
            console.error("Error updating user profile:", error);
            return res.status(500).json({ error: 'Could not update user profile.' });
        }
    });
});
