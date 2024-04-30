import { useState, useRef, useContext } from "react";

import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  IconButton,
  useDisclosure,
  Avatar,
} from "@chakra-ui/react";
import { FaUser } from "react-icons/fa";

import { UserLoginForm } from "./UserLoginForm";
import { UserRegisterForm } from "./UserRegisterForm";

import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";

export const Login = ({ setUserRef }) => {
  const [user, setUser] = useState();
  const [nick, setNick] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserRef(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <IconButton
        aria-label="Manage user"
        icon={<FaUser />}
        onClick={onOpen}
        title="Zarządzaj kontem"
      >
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
                    <UserLoginForm
                      setUser={setUser}
                      setUserRef={setUserRef}
                      setShowLogin={setShowLogin}
                      setNick={setNick}
                    />
                  </DrawerBody>
                </div>
              ) : (
                <div className="flex flex-col">
                  <DrawerHeader>Rejestracja</DrawerHeader>
                  <DrawerBody>
                    <UserRegisterForm
                      setShowLogin={setShowLogin}
                      setUserRef={setUserRef}
                      setUser={setUser}
                      setNick={setNick}
                    />
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
