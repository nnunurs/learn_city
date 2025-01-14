import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../config/firebase";
import { addDoc, collection } from "@firebase/firestore";
import { useForm } from "react-hook-form";

import { UserGoogleLogin } from "./UserGoogleLogin";
import { getErrorMessages } from "../scripts/scripts";

export const UserRegisterForm = ({ setUser, setUserRef, setNickname }) => {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Dodaj użytkownika do Firestore
      const docRef = await addDoc(collection(db, "users"), {
        uid: userCredential.user.uid,
        nickname: data.nickname,
        email: data.email,
        provider: "email",
      });

      setUser(userCredential.user);
      setUserRef(docRef.id);
      setNickname(data.nickname);
    } catch (error) {
      console.error(error);
      setError(getErrorMessages(error.code));
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleFormSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="form-control w-full">
          <input
            type="text"
            placeholder="Nazwa użytkownika"
            className={`input input-bordered w-full ${errors.nickname && 'input-error'}`}
            {...register("nickname", {
              required: "Nazwa użytkownika jest wymagana",
              minLength: {
                value: 3,
                message: "Nazwa użytkownika musi mieć co najmniej 3 znaki",
              },
            })}
          />
          {errors.nickname && (
            <label className="label">
              <span className="label-text-alt text-error">{errors.nickname.message}</span>
            </label>
          )}
        </div>

        <div className="form-control w-full">
          <input
            type="email"
            placeholder="Email"
            className={`input input-bordered w-full ${errors.email && 'input-error'}`}
            {...register("email", {
              required: "Email jest wymagany",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Nieprawidłowy adres email",
              },
            })}
          />
          {errors.email && (
            <label className="label">
              <span className="label-text-alt text-error">{errors.email.message}</span>
            </label>
          )}
        </div>

        <div className="form-control w-full">
          <input
            type="password"
            placeholder="Hasło"
            className={`input input-bordered w-full ${errors.password && 'input-error'}`}
            {...register("password", {
              required: "Hasło jest wymagane",
              minLength: {
                value: 6,
                message: "Hasło musi mieć co najmniej 6 znaków",
              },
            })}
          />
          {errors.password && (
            <label className="label">
              <span className="label-text-alt text-error">{errors.password.message}</span>
            </label>
          )}
        </div>

        <div className="form-control w-full">
          <input
            type="password"
            placeholder="Powtórz hasło"
            className={`input input-bordered w-full ${errors.confirmPassword && 'input-error'}`}
            {...register("confirmPassword", {
              required: "Powtórz hasło",
              validate: (value, formValues) => value === formValues.password || "Hasła nie są takie same"
            })}
          />
          {errors.confirmPassword && (
            <label className="label">
              <span className="label-text-alt text-error">{errors.confirmPassword.message}</span>
            </label>
          )}
        </div>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className={`btn btn-primary ${isLoading && 'loading'}`}
          disabled={isLoading}
        >
          {isLoading ? 'Rejestracja...' : 'Zarejestruj się'}
        </button>
      </form>

      <div className="divider">lub</div>

      <UserGoogleLogin
        setUser={setUser}
        setUserRef={setUserRef}
        setNickname={setNickname}
      />
    </div>
  );
};
