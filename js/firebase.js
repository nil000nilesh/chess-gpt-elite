/* ═══════════════════════════════════════════
   firebase.js — Firebase Init Only
   Config badlani ho → sirf yahan
═══════════════════════════════════════════ */

const firebaseConfig = {
    apiKey:            "AIzaSyC9jqSN143CiCvaJOOVJDRocO5bPLgi1-k",
    authDomain:        "chess-elite-app.firebaseapp.com",
    projectId:         "chess-elite-app",
    storageBucket:     "chess-elite-app.firebasestorage.app",
    messagingSenderId: "454826539457",
    appId:             "1:454826539457:web:43373370bf29e7eb145740",
    measurementId:     "G-15XMR81XD8"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();
