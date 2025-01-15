import { useState } from "react";
import { useForm } from "react-hook-form";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

import { UserGoogleLogin } from "./UserGoogleLogin";
import { getErrorMessages } from "../scripts/scripts";

export const UserLoginForm = ({ setUser, setUserRef, setNickname }) => {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError("");
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
        setNickname(doc.data().nickname);
      });

      setUser(userCredential.user);
    } catch (error) {
      setError(getErrorMessages(error.code));
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
          {isLoading ? 'Logowanie...' : 'Zaloguj się'}
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
