import { useState, useRef, useEffect } from "react";
import { FaUser } from "react-icons/fa";
import { UserLoginForm } from "./UserLoginForm";
import { UserRegisterForm } from "./UserRegisterForm";
import { auth, db } from "../config/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

export const Login = ({ setUserRef, children }) => {
  const [user, setUser] = useState();
  const [nickname, setNickname] = useState("");
  const [isLoginView, setIsLoginView] = useState(false);
  const modalRef = useRef();
  const btnRef = useRef();

  useEffect(() => {
    // Sprawdź czy użytkownik jest już zalogowany przy starcie
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setUserRef(currentUser.uid);
      // Pobierz nickname z Firestore
      const fetchNickname = async () => {
        const q = query(
          collection(db, "users"),
          where("uid", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          setNickname(doc.data().nickname);
        });
      };
      fetchNickname();
    }

    // Nasłuchuj na zmiany stanu autoryzacji
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setUserRef(currentUser.uid);
        // Pobierz nickname z Firestore
        const q = query(
          collection(db, "users"),
          where("uid", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          setNickname(doc.data().nickname);
        });
      } else {
        setUserRef(null);
        setNickname("");
      }
    });

    return () => unsubscribe();
  }, [setUserRef]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserRef(null);
      setNickname("");
      if (modalRef.current) {
        modalRef.current.close();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const showModal = () => {
    if (modalRef.current) {
      modalRef.current.showModal();
    }
  };

  return (
    <div className="flex items-center">
      {children ? (
        children(showModal)
      ) : (
        <div className="avatar cursor-pointer flex items-center justify-center" onClick={showModal} title={user ? "Zarządzaj kontem" : "Zaloguj się"}>
          <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ${!user && 'p-2.5'}`}>
            {user ? (
              user.photoURL ? (
                <img
                  className="w-full h-full object-cover min-w-full min-h-full"
                  src={user.photoURL}
                  alt={user.displayName || nickname || 'Avatar użytkownika'}
                  ref={btnRef}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary text-white text-lg uppercase">
                  {(user.displayName?.[0] || nickname?.[0] || 'U')}
                </div>
              )
            ) : (
              <FaUser className="text-base-content w-full h-full" />
            )}
          </div>
        </div>
      )}

      <dialog ref={modalRef} className="modal modal-right">
        <div className="modal-box h-full bg-base-100">
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">
                {user ? "Zarządzanie kontem" : isLoginView ? "Logowanie" : "Rejestracja"}
              </h3>
              <form method="dialog">
                <button className="btn btn-sm btn-circle btn-ghost">✕</button>
              </form>
            </div>

            <div className="flex-1">
              {user ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 bg-base-200 p-4 rounded-lg">
                    <div className="avatar">
                      <div className="w-16 h-16 rounded-full overflow-hidden">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName || nickname || 'Avatar użytkownika'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary text-white text-2xl uppercase">
                            {(user.displayName?.[0] || nickname?.[0] || 'U')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="font-bold">{user.displayName || nickname || 'Użytkownik'}</div>
                      <div className="text-sm opacity-60">{user.email}</div>
                    </div>
                  </div>
                  <button className="btn btn-error" onClick={handleSignOut}>
                    Wyloguj się
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {isLoginView ? (
                    <UserLoginForm setUser={setUser} setUserRef={setUserRef} setNickname={setNickname} />
                  ) : (
                    <UserRegisterForm setUser={setUser} setUserRef={setUserRef} setNickname={setNickname} />
                  )}
                  <button
                    className="btn btn-ghost"
                    onClick={() => setIsLoginView(!isLoginView)}
                  >
                    {isLoginView ? "Nie masz konta? Zarejestruj się" : "Masz już konto? Zaloguj się"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>zamknij</button>
        </form>
      </dialog>
    </div>
  );
};
