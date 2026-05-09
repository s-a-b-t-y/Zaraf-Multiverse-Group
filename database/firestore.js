import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, limit, where, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyBIQp0jt28jaAodL2ASQFCj4sXFsc6qmsY",
    authDomain: "zaraf-multiverse-group.firebaseapp.com",
    projectId: "zaraf-multiverse-group",
    storageBucket: "zaraf-multiverse-group.firebasestorage.app",
    messagingSenderId: "756109036982",
    appId: "1:756109036982:web:8c977e5710bbab29b94517",
    measurementId: "G-XPGCG2T7NV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs, query, limit, where, orderBy, serverTimestamp };
