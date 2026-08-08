import { useState, useEffect, useCallback, useRef } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  getQueue,
  removeFromQueue,
  markFailed,
} from "../utils/offlineQueue";

export default function useOfflineSalesSync() {
  const [queue, setQueue] = useState(getQueue());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  const refreshQueue = useCallback(() => {
    setQueue(getQueue());
  }, []);

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);

    const pending = getQueue().filter((item) => item.status === "PENDING");
    let syncedCount = 0;

    for (const entry of pending) {
      try {
        await api.post(
          "/sales",
          {
            ...entry.payload,
            clientReferenceId: entry.clientReferenceId,
            clientCreatedAt: entry.queuedAt,
          },
          { timeout: 10000 }
        );

        removeFromQueue(entry.clientReferenceId);
        syncedCount++;
        refreshQueue();
      } catch (err) {
        if (!err.response) {
          // Still can't reach the server — stop here, try the rest later.
          break;
        }
        // Server responded with a real error (e.g. stock changed under us).
        // Flag it for review instead of silently dropping it or retrying forever.
        markFailed(
          entry.clientReferenceId,
          err.response?.data?.message || "Sync failed"
        );
        refreshQueue();
      }
    }

    if (syncedCount > 0) {
      toast.success(`${syncedCount} queued sale(s) synced`);
    }

    syncingRef.current = false;
    setSyncing(false);
  }, [refreshQueue]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back online — syncing queued sales");
      syncNow();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("You're offline — sales will be queued");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncNow]);

  useEffect(() => {
    // 'online'/'offline' events aren't always reliable — poll as a backstop.
    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncNow();
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [syncNow]);

  useEffect(() => {
    // also try once right when the app loads
    if (navigator.onLine) {
      syncNow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingCount = queue.filter((i) => i.status === "PENDING").length;
  const failedCount = queue.filter((i) => i.status === "FAILED").length;

  return {
    isOnline,
    syncing,
    pendingCount,
    failedCount,
    queue,
    syncNow,
    refreshQueue,
  };
}