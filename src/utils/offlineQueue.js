const QUEUE_KEY = "nova_offline_sales_queue";

const readQueue = () => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read offline queue", err);
    return [];
  }
};

const writeQueue = (queue) => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("Failed to write offline queue", err);
  }
};

export const getQueue = () => readQueue();

export const addToQueue = (entry) => {
  const queue = readQueue();
  queue.push({
    ...entry,
    status: "PENDING",
    queuedAt: new Date().toISOString(),
  });
  writeQueue(queue);
  return queue;
};

// Deliberately no general "remove" exposed for arbitrary use —
// only the sync process itself should ever clear a queued sale,
// and only after a confirmed successful sync. No delete button
// anywhere in the UI calls this directly.
export const removeFromQueue = (clientReferenceId) => {
  const queue = readQueue().filter(
    (item) => item.clientReferenceId !== clientReferenceId
  );
  writeQueue(queue);
  return queue;
};

export const markFailed = (clientReferenceId, errorMessage) => {
  const queue = readQueue().map((item) =>
    item.clientReferenceId === clientReferenceId
      ? { ...item, status: "FAILED", errorMessage }
      : item
  );
  writeQueue(queue);
  return queue;
};

export const getPendingCount = () =>
  readQueue().filter((item) => item.status === "PENDING").length;

export const getFailedCount = () =>
  readQueue().filter((item) => item.status === "FAILED").length;