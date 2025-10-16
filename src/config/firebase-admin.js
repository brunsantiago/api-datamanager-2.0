const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin
// IMPORTANTE: Necesitas el archivo service-account.json con las credenciales
// Descárgalo desde Firebase Console -> Project Settings -> Service Accounts
let firebaseInitialized = false;

try {
  const serviceAccountPath = path.join(__dirname, '../../service-account.json');
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  firebaseInitialized = true;
  console.log('✅ Firebase Admin inicializado correctamente');
} catch (error) {
  console.error('❌ Error inicializando Firebase Admin:', error.message);
  console.error('⚠️  Asegúrate de tener el archivo service-account.json en la raíz del proyecto');
}

/**
 * Verifica un token de Firebase y devuelve los datos del usuario
 * @param {string} idToken - Token de Firebase del cliente
 * @returns {Promise<Object>} Datos decodificados del token
 */
const verifyFirebaseToken = async (idToken) => {
  if (!firebaseInitialized) {
    throw new Error('Firebase Admin no está inicializado');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error('Token de Firebase inválido o expirado');
  }
};

module.exports = {
  admin,
  verifyFirebaseToken,
  firebaseInitialized
};
