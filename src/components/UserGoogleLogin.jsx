import { IconButton } from "@chakra-ui/react";
import { FaGoogle } from "react-icons/fa";
import { signInWithPopup } from "firebase/auth";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { auth, googleProvider, db } from "../config/firebase";

export const UserGoogleLogin = ({ setUser, setUserRef }) => {
  const defaultUser = (uid, nick, email, photoURL, provider) => {
    return { uid, nick, email, photoURL, provider };
  };

  const handleGoogleSignIn = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;
      const q = query(collection(db, "users"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        await addDoc(collection(db, "users"), {
          ...defaultUser(
            user.uid,
            user.displayName,
            user.email,
            user.photoURL,
            "google"
          ),
        });
      }
      querySnapshot.forEach((doc) => setUserRef(doc.id));

      setUser(userCredential.user);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <IconButton
      aria-label="Zaloguj się z Google"
      icon={<FaGoogle />}
      onClick={handleGoogleSignIn}
    />
  );
};
