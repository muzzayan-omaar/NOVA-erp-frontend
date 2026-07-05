import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [stores, setStores] = useState([]);
  const [activeStoreId, setActiveStoreId] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load user from localStorage (after login)
   */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);

      setUser(parsedUser);
      setActiveStoreId(parsedUser.activeStoreId || parsedUser.storeId);

      fetchStores();
    }

    setLoading(false);
  }, []);

  /**
   * Fetch all stores for company
   */
  const fetchStores = async () => {
    try {
      const res = await api.get("/stores");
      setStores(res.data);
    } catch (err) {
      console.error("Failed to load stores", err);
    }
  };

  /**
   * Switch active store (MAIN FUNCTION)
   */
  const switchStore = async (storeId) => {
    try {
      const res = await api.post("/stores/switch", {
        storeId,
      });

      const updatedUser = res.data.user;

      setUser(updatedUser);
      setActiveStoreId(updatedUser.activeStoreId);

      // persist
      localStorage.setItem("user", JSON.stringify(updatedUser));

      return updatedUser;
    } catch (err) {
      console.error("Switch store failed", err);
    }
  };

  /**
   * Helper: current store object
   */
  const activeStore = stores.find(
    (s) => s.id === activeStoreId
  );

  return (
    <CompanyContext.Provider
      value={{
        user,
        setUser,
        stores,
        activeStoreId,
        activeStore,
        switchStore,
        loading,
        refreshStores: fetchStores,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => useContext(CompanyContext);