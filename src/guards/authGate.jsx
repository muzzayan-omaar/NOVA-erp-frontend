import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

export default function AuthGate({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hydrate } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    hydrate();
    setChecking(false);
  }, [hydrate]);

  useEffect(() => {
    if (checking) return;

    if (!user) {
      navigate("/login");
      return;
    }

    if (user.mustChangePassword && location.pathname !== "/change-password") {
      navigate("/change-password");
    }
  }, [user, checking, navigate, location.pathname]);

  if (checking) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return user ? children : null;
}