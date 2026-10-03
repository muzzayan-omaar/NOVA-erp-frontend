import { useEffect, useState, useCallback } from "react";
import api from "../services/api";

export default function useCurrentShift() {
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/shifts/current");
      setShift(res.data);
    } catch (err) {
      console.error("Failed to load current shift", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { shift, loading, refetch };
}