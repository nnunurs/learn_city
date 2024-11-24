import { useState } from "react";
import { FormControl, FormErrorMessage, Input, Button } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../config/firebase";

import { UserGoogleLogin } from "./UserGoogleLogin";
import { getErrorMessages } from "../scripts/scripts";

export const UserLoginForm = ({
  setUser,
  setUserRef,
  setIsLoginView,
  setNickname,
}) => {
  const [serverError, setServerError] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const handleLogin = async (data) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const q = query(
        collection(db, "users"),
        where("uid", "==", userCredential.user.uid)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        setUserRef(doc.id);
        setNickname(doc.data().nick);
      });

      setUser(userCredential.user);
      reset();
    } catch (error) {
      setServerError(error.code);
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleLogin)} className="flex flex-col gap-2">
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
          {errors.email && errors.email.message}
        </FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={errors.password}>
        <Input
          type="password"
          placeholder="Hasło"
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
        <Button colorScheme="green" className="mr-4" type="submit">
          Zaloguj się
        </Button>
        <UserGoogleLogin setUser={setUser} setUserRef={setUserRef} />
        <Button
          className="mt-2"
          onClick={() => setIsLoginView(false)}
          variant="link"
        >
          Nie masz konta? Zarejestruj się
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
