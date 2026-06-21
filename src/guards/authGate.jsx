import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

export default function AuthGate({ children }) {
  const navigate = useNavigate();
  const { user, loadAuth } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    loadAuth();
    setChecking(false);
  }, []);

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