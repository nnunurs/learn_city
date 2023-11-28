import { useState } from "react";
import { Button, FormControl, Input, FormErrorMessage } from "@chakra-ui/react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../config/firebase";
import { addDoc, collection } from "@firebase/firestore";
import { useForm } from "react-hook-form";

import { UserGoogleLogin } from "./UserGoogleLogin";
import { getErrorMessages } from "../scripts/scripts";

export const UserRegisterForm = ({
  setShowLogin,
  setUserRef,
  setUser,
  setNick,
}) => {
  const [serverError, setServerError] = useState(null);

  const defaultUser = (uid, nick, email, photoURL, provider) => {
    return { uid, nick, email, photoURL, provider };
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const handleSignIn = async (data) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = userCredential.user;
      const userDoc = await addDoc(collection(db, "users"), {
        ...defaultUser(user.uid, data.nick, user.email, user.photoURL, "local"),
      });
      setUserRef(userDoc.id);
      setUser(userCredential.user);
      reset();
    } catch (error) {
      console.error(error);
      setServerError(error.code);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleSignIn)} className="flex flex-col gap-2">
      <FormControl isInvalid={errors.nick}>
        <Input
          type="text"
          placeholder="Nick"
          name="nick"
          {...register("nick", {
            required: "Nick jest wymagany",
            minLength: {
              value: 3,
              message: "Nick musi mieć co najmniej 3 znaki",
            },
          })}
        />
        <FormErrorMessage>
          {errors.nick && errors.nick.message}
        </FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={errors.email}>
        <Input
          type="email"
          placeholder="Adres email"
          name="email"
          {...register("email", {
            required: "Email jest wymagany",
          })}
        />
        <FormErrorMessage>
          {" "}
          {errors.email && errors.email.message}
        </FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={errors.password}>
        <Input
          type="password"
          placeholder="Hasło"
          name="password"
          {...register("password", {
            required: "Hasło jest wymagane",
            minLength: {
              value: 6,
              message: "Hasło musi mieć co najmniej 6 znaków",
            },
          })}
        />
        <FormErrorMessage>
          {errors.password && errors.password.message}
        </FormErrorMessage>
      </FormControl>
      <div className="mt-4">
        <Button className="mr-4" colorScheme="green" type="submit">
          Zarejestruj się
        </Button>
        <UserGoogleLogin setUser={setUser} setUserRef={setUserRef} />
        <Button
          className="mt-2"
          onClick={() => setShowLogin(true)}
          variant="link"
        >
          Masz już konto? Zaloguj się
        </Button>
        {serverError && (
          <p className="text-red-500 text-sm mt-2">
            {getErrorMessages(serverError)}
          </p>
        )}
      </div>
    </form>
  );
};
