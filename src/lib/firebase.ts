import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.error("Login failed:", error);
    if (error.code === 'auth/unauthorized-domain') {
      const domain = window.location.hostname;
      alert(`【Googleログインエラー】\n現在のドメイン「${domain}」が許可されていません。\n\nFirebase Console > Authentication > Settings > Authorized domains に、上記のドメインを追加してください。\n(※追加後、反映まで数時間かかる場合があります)`);
    } else {
      alert(`ログインエラー: ${error.message}`);
    }
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
