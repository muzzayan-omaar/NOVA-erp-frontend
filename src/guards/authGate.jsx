import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

export default function AuthGate({ children }) {
  const navigate = useNavigate();
  const { user, hydrate } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
  hydrate();
  setChecking(false);
}, [hydrate]);
  

  useEffect(() => {
    if (!checking && !user) {
      navigate("/login");
    }
  }, [user, checking, navigate]);

  if (checking) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return user ? children : null;
}