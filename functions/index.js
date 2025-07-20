'use strict';

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const fetch = require("node-fetch");
admin.initializeApp();

const SUPER_ADMIN_EMAIL = "franciscovillahermosa@gmail.com";

// Auto asignar rol de super admin
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  if (user.email === SUPER_ADMIN_EMAIL) {
    try {
      await admin.auth().setCustomUserClaims(user.uid, { admin: true });
      console.log(`Super admin creado: ${user.email}`);
    } catch (error) {
      console.error("Error creando super admin:", error);
    }
  }
});

// Modificar roles (admin, premium, doctor)
exports.toggleUserRole = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Método no permitido');

    try {
      const idToken = (req.headers.authorization || '').split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: 'Token no enviado' });

      const decoded = await admin.auth().verifyIdToken(idToken);
      if (!decoded.admin) return res.status(403).json({ error: 'No autorizado' });

      const { uid, role, status } = req.body;
      if (!uid || typeof role !== 'string' || typeof status !== 'boolean') {
        return res.status(400).json({ error: 'Se requiere uid, role y status.' });
      }

      if (decoded.uid === uid && role === 'admin' && !status) {
        return res.status(400).json({ error: 'No puedes quitarte tu propio rol de administrador.' });
      }

      const user = await admin.auth().getUser(uid);
      const updatedClaims = {
        ...user.customClaims,
        [role]: status
      };

      await admin.auth().setCustomUserClaims(uid, updatedClaims);
      return res.status(200).json({ message: `Rol ${role} actualizado a ${status} para el usuario ${uid}` });
    } catch (error) {
      console.error("Error actualizando rol:", error);
      return res.status(500).json({ error: 'No se pudo actualizar el rol.' });
    }
  });
});

// Listar usuarios
exports.listAllUsers = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Método no permitido');

    try {
      const idToken = (req.headers.authorization || '').split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: 'Token no enviado' });

      const decoded = await admin.auth().verifyIdToken(idToken);
      if (!decoded.admin) return res.status(403).json({ error: 'No autorizado' });

      const result = await admin.auth().listUsers(1000);
      const users = result.users.map(user => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'No Name',
        isAdmin: !!user.customClaims?.admin,
        isPremium: !!user.customClaims?.premium,
        isDoctor: !!user.customClaims?.doctor,
      }));

      return res.status(200).json({ users });
    } catch (error) {
      console.error("Error al listar usuarios:", error);
      return res.status(500).json({ error: 'Error al obtener los usuarios.' });
    }
  });
});

// Obtener estadísticas del panel de administración
exports.getAdminDashboardStats = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'GET') return res.status(405).send('Método no permitido');

        try {
            const idToken = (req.headers.authorization || '').split('Bearer ')[1];
            if (!idToken) return res.status(401).json({ error: 'Token no enviado' });

            const decoded = await admin.auth().verifyIdToken(idToken);
            if (!decoded.admin) return res.status(403).json({ error: 'No autorizado' });

            // Obtener todos los usuarios y contar roles
            const listUsersResult = await admin.auth().listUsers(1000);
            let adminCount = 0;
            let premiumCount = 0;
            let doctorCount = 0;
            let normalUserCount = 0;

            listUsersResult.users.forEach(user => {
                const claims = user.customClaims || {};
                const isAdmin = !!claims.admin;
                const isPremium = !!claims.premium;
                const isDoctor = !!claims.doctor;

                if (isAdmin) adminCount++;
                if (isPremium) premiumCount++;
                if (isDoctor) doctorCount++;
                
                // Un usuario es "normal" si no tiene ninguno de estos roles especiales.
                if (!isAdmin && !isPremium && !isDoctor) {
                    normalUserCount++;
                }
            });

            // Obtener el conteo de evaluaciones
            const evaluationsSnapshot = await admin.firestore().collection('evaluations').count().get();

            const stats = {
                totalUsers: listUsersResult.users.length,
                adminCount,
                premiumCount,
                doctorCount,
                normalUserCount,
                totalEvaluations: evaluationsSnapshot.data().count,
            };

            return res.status(200).json(stats);
        } catch (error) {
            console.error("Error al obtener estadísticas del dashboard:", error);
            return res.status(500).json({ error: 'Error al obtener las estadísticas.' });
        }
    });
});


// Crear sesión de pago
exports.createCheckoutSession = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send("Método no permitido");
    
    // Lazy initialize stripe
    const stripe = require("stripe")(functions.config().stripe.secret_key);

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: "Eye Health Analysis - Virtual Vision Test" },
            unit_amount: 1000,
          },
          quantity: 1,
        }],
        mode: "payment",
        success_url: "https://virtual-vision-test-ai-eye-health-analysis-286869624215.us-west1.run.app/?payment_success=true",
        cancel_url: "https://virtual-vision-test-ai-eye-health-analysis-286869624215.us-west1.run.app/?payment_cancelled=true",
      });

      return res.status(200).json({ id: session.id });
    } catch (error) {
      console.error("Error creando sesión de Stripe:", error);
      return res.status(500).json({ error: error.message });
    }
  });
});

// Enviar feedback
exports.submitFeedback = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Método no permitido');

    try {
      const { rating, comment, evaluationId } = req.body;
      const idToken = (req.headers.authorization || '').split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: 'Token no enviado' });

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userEmail = decodedToken.email;

      await admin.firestore().collection('feedback').add({
        userEmail,
        rating,
        comment,
        evaluationId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ message: 'Feedback enviado exitosamente' });
    } catch (error) {
      console.error('Error al enviar feedback:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
});

// Obtener feedback
exports.getFeedback = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "GET") return res.status(405).send("Método no permitido");

    try {
      const idToken = (req.headers.authorization || '').split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: 'Token no enviado' });

      const decoded = await admin.auth().verifyIdToken(idToken);
      if (!decoded.admin) return res.status(403).json({ error: 'No autorizado' });

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
      console.error("Obteniendo feedback:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  });
});

// Buscar oftalmólogos con proxy
exports.getNearbyOphthalmologistsProxy = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido. Usa GET.' });

    const { stateCode, cityName } = req.query;
    const limit = req.query.limit || 10;

    if (!stateCode || typeof stateCode !== 'string') {
      return res.status(400).json({ error: 'Parámetro "stateCode" faltante o inválido.' });
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
      console.error("Error en función proxy:", error);
      return res.status(500).json({ error: 'Error interno al buscar oftalmólogos.' });
    }
  });
});

// Listar exámenes (para doctores o administradores)
exports.listAllEvaluations = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido. Usa GET.' });

    try {
      const idToken = (req.headers.authorization || '').split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: 'Token no enviado' });

      const decoded = await admin.auth().verifyIdToken(idToken);
      if (!decoded.admin && !decoded.doctor) return res.status(403).json({ error: 'No autorizado' });

      const snapshot = await admin.firestore().collection('evaluations').orderBy('createdAt', 'desc').get();
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return res.status(200).json({ evaluations: data });
    } catch (error) {
      console.error("Error obteniendo evaluaciones:", error);
      return res.status(500).json({ error: 'Error al obtener evaluaciones' });
    }
  });
});

// Añadir nota del doctor (versión robusta)
exports.addDoctorNote = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido. Usa POST.' });

    try {
      const idToken = (req.headers.authorization || '').split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: 'Token no enviado' });

      const decoded = await admin.auth().verifyIdToken(idToken);
      if (!decoded.doctor && !decoded.admin) {
        return res.status(403).json({ error: 'Solo los doctores o administradores pueden añadir notas.' });
      }

      const { evaluationId, noteText } = req.body;

      if (!evaluationId || typeof evaluationId !== 'string') {
        return res.status(400).json({ error: 'evaluationId es requerido y debe ser un string' });
      }

      if (!noteText || typeof noteText !== 'string') {
        return res.status(400).json({ error: 'noteText es requerido y debe ser un string' });
      }

      const evaluationRef = admin.firestore().collection('evaluations').doc(evaluationId);
      const docSnapshot = await evaluationRef.get();

      if (!docSnapshot.exists) {
        return res.status(404).json({ error: 'Evaluación no encontrada' });
      }

      const note = {
        text: noteText,
        doctorId: decoded.uid,
        doctorName: decoded.name || decoded.email || 'Dr. Anónimo',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await evaluationRef.update({
        doctorNotes: admin.firestore.FieldValue.arrayUnion(note),
        status: 'responded',
        respondedBy: note.doctorName,
        respondedAt: admin.firestore.FieldValue.serverTimestamp(),
      });


      console.log(`Nota añadida a la evaluación ${evaluationId} por el usuario ${decoded.uid}`);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error al añadir nota:", error);
      return res.status(500).json({ error: 'Error interno al añadir nota', details: error.message });
    }
  });
});
