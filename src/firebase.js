import firebase from "firebase/app"
import "firebase/auth"
import "firebase/firestore"

import Filter from "bad-words"
import { ref, computed, onUnmounted } from "vue"

firebase.initializeApp({
    apiKey: "AIzaSyBa9KVUI1J5htik8OCKaKVAaAEHN6i_x38",
    authDomain: "vue-chat-app-caebc.firebaseapp.com",
    projectId: "vue-chat-app-caebc",
    storageBucket: "vue-chat-app-caebc.appspot.com",
    messagingSenderId: "97111329355",
    appId: "1:97111329355:web:dcfd145115d9ef9dc91bce"
  });

const auth = firebase.auth();

export function useAuth() {
    const user = ref(null);
    const unsubscribe = auth.onAuthStateChanged(_user => (user.value = _user));
    onUnmounted(unsubscribe);
    const isLogin = computed(() => user.value !== null);

    const signIn = async () => {
        const googleProvider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(googleProvider);
    }

    const signOut = () => auth.signOut();

    return { user, isLogin, signIn, signOut }
}

const firestore = firebase.firestore();
const messagesCollection = firestore.collection("messages");
const messagesQuery = messagesCollection.orderBy("createdAt", "desc").limit(100);
const filter = new Filter();

export function useChat() {
    const messages = ref([]);
    const unsubscribe = messagesQuery.onSnapshot(snapshot => {
        messages.value = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .reverse();
    });

    onUnmounted(unsubscribe);

    const { user, isLogin } = useAuth();
    const sendMessage = text => {
        if(!isLogin.value) return;
        const { photoURL, uid, displayName } = user.value;
        messagesCollection.add({
            userName: displayName,
            userId: uid,
            userPhotoURL: photoURL,
            text: filter.clean(text),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    };

    return  {messages, sendMessage }
}