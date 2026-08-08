import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import usePlatformAuthStore from "../store/usePlatformAuthStore";

export default function PlatformAuthGate({ children }) {
  const navigate = useNavigate();
  const { admin, hydrate } = usePlatformAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    hydrate();
    setChecking(false);
  }, [hydrate]);

  useEffect(() => {
    if (!checking && !admin) {
      navigate("/platform/login");
    }
  }, [admin, checking, navigate]);

  if (checking) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return admin ? children : null;
}