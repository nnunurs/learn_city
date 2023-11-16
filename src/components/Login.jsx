import { useState, useRef } from "react";

import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  IconButton,
  useDisclosure,
  Avatar,
} from "@chakra-ui/react";
import { FaUser, FaGoogle } from "react-icons/fa";

import { UserLoginInput } from "./UserLoginInput";

import { auth, googleProvider, db } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  getDocFromCache,
} from "firebase/firestore";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState();
  const [showLogin, setShowLogin] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef();

  const defaultUser = (uid, nick, email, photoURL, provider) => {
    return { uid, nick, email, photoURL, provider };
  };

  const handleSignIn = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      await addDoc(collection(db, "users"), {
        ...defaultUser(user.uid, nick, user.email, user.photoURL, "local"),
      });
      db.collection("users").doc("user.uid").collection("streets").add({});

      setUser(userCredential.user);
      console.log(user);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      setUser(userCredential.user);
      console.log(user);
    } catch (error) {
      console.error(error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;
      const q = query(collection(db, "users"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        const userDoc = await addDoc(collection(db, "users"), {
          ...defaultUser(
            user.uid,
            user.displayName,
            user.email,
            user.photoURL,
            "google"
          ),
        });

        const streets = collection(db, "users", userDoc.id, "streets");
        await addDoc(streets, {});
      }

      setUser(userCredential.user);
      console.log(user);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <IconButton aria-label="Manage user" icon={<FaUser />} onClick={onOpen}>
        Otwórz menu
      </IconButton>
      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        finalFocusRef={btnRef}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          {user ? (
            <div className="flex flex-col">
              <DrawerHeader className="flex items-center">
                <Avatar
                  className="mr-5"
                  name={user.displayName}
                  src={user.photoURL}
                  alt="avatar"
                />
                {user.displayName ? user.displayName : nick}
              </DrawerHeader>
              <DrawerBody className="flex justify-center">
                <Button onClick={handleSignOut}>Wyloguj się</Button>
              </DrawerBody>
            </div>
          ) : (
            <div>
              {showLogin ? (
                <div className="flex flex-col">
                  <DrawerHeader>Logowanie</DrawerHeader>
                  <DrawerBody>
                    <UserLoginInput
                      label="Adres email"
                      type="email"
                      placeholder="Email"
                      value={email}
                      setter={setEmail}
                    />
                    <UserLoginInput
                      label="Hasło"
                      type="password"
                      placeholder="Hasło"
                      value={password}
                      setter={setPassword}
                    />
                    <div className="mt-4">
                      <Button
                        colorScheme="green"
                        className="mr-4"
                        onClick={handleLogin}
                      >
                        Zaloguj się
                      </Button>
                      <IconButton
                        aria-label="Zaloguj się z Google"
                        icon={<FaGoogle />}
                        onClick={handleGoogleSignIn}
                      />
                      <Button
                        className="mt-2"
                        onClick={() => setShowLogin(false)}
                        variant="link"
                      >
                        Nie masz konta? Zarejestruj się
                      </Button>
                    </div>
                  </DrawerBody>
                </div>
              ) : (
                <div className="flex flex-col">
                  <DrawerHeader>Rejestracja</DrawerHeader>
                  <DrawerBody>
                    <UserLoginInput
                      label="Nick"
                      type="text"
                      placeholder="Nick"
                      value={nick}
                      setter={setNick}
                    />
                    <UserLoginInput
                      label="Adres "
                      type="email"
                      placeholder="Email"
                      value={email}
                      setter={setEmail}
                    />
                    <UserLoginInput
                      label="Hasło"
                      type="password"
                      placeholder="Hasło"
                      value={password}
                      setter={setPassword}
                    />
                    <div className="mt-4">
                      <Button
                        className="mr-4"
                        colorScheme="green"
                        onClick={handleSignIn}
                      >
                        Zarejestruj się
                      </Button>
                      <IconButton
                        aria-label="Zaloguj się z Google"
                        icon={<FaGoogle />}
                        onClick={handleGoogleSignIn}
                      />
                      <Button
                        className="mt-2"
                        onClick={() => setShowLogin(true)}
                        variant="link"
                      >
                        Masz już konto? Zaloguj się
                      </Button>
                    </div>
                  </DrawerBody>
                </div>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};
