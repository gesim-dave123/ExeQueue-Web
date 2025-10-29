import { useCallback, useEffect, useRef, useState } from "react";
import {
  getQueueListByStatus,
  getSingleQueue,
} from "../../../api/staff.queue.api";
import { normalizeStatusForDisplay } from "../../../utils/NormalizeStatus";
import { formatQueueData } from "../../../utils/QueueDetailsFormatter";

const ManageQueueHook = ({
  socket,
  isConnected,
  showWindowModal,
  setShowWindowModal,
  // sortByPriorityPattern,
  loadWindows,
  showToast,
  // formatTime,
  setSelectedWindow,
  selectedWindow,
  Status,
  QueueActions,
  SocketEvents,
  WindowEvents,
}) => {
  // ==================== STATE MANAGEMENT ====================

  // Using Map for O(1) lookups instead of array operations
  const [globalQueueMap, setGlobalQueueMap] = useState(new Map());
  const [globalQueueIds, setGlobalQueueIds] = useState([]); // Ordered IDs
  const [totalWaitingCount, setTotalWaitingCount] = useState(0);

  const [deferredQueueMap, setDeferredQueueMap] = useState(new Map());
  const [deferredQueueIds, setDeferredQueueIds] = useState([]);
  const [totalDeferredCount, setTotalDeferredCount] = useState(0);

  const [currentQueue, setCurrentQueue] = useState(null);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [nextInLineLoading, setNextInlineLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Pagination state
  const isFetchingRef = useRef(false);
  const INITIAL_LOAD = 100;
  const LOAD_MORE_SIZE = 50;
  const [hasMoreWaiting, setHasMoreWaiting] = useState(true);
  const [hasMoreDeferred, setHasMoreDeferred] = useState(true);

  // ==================== HELPER FUNCTIONS ====================
  const sortByPriorityPattern = useCallback((queues) => {
    console.log("🔢 Starting sort with queues:", queues?.length);
    // console.log("Queue", queues);
    if (!queues || queues.length === 0) {
      console.log("⚠️ No queues to sort");
      return [];
    }
    // More flexible filtering with fallbacks
    const priority = queues.filter((q) => {
      const type = q.type;
      return type === "Priority";
    });
    // .sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));

    const regular = queues.filter((q) => {
      const type = q.type;
      return type === "Regular";
    });
    // .sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
    const sorted = [];
    let pIndex = 0;
    let rIndex = 0;

    while (pIndex < priority.length || rIndex < regular.length) {
      if (pIndex < priority.length) {
        sorted.push(priority[pIndex]);
        pIndex++;
      }

      if (rIndex < regular.length) {
        sorted.push(regular[rIndex]);
        rIndex++;
      }
    }

    return sorted;
  }, []);
  // Add queue to waiting list with sorting
  const addToWaitingQueue = useCallback(
    (formattedQueue) => {
      setGlobalQueueMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(formattedQueue.queueId, formattedQueue);
        return newMap;
      });

      setGlobalQueueIds((prev) => {
        // Check if already exists
        if (prev.includes(formattedQueue.queueId)) return prev;

        // Create temp array with queue objects for sorting
        const queueObjects = prev
          .map((id) => globalQueueMap.get(id))
          .filter(Boolean);
        queueObjects.push(formattedQueue);

        // Sort using your existing function
        const sorted = sortByPriorityPattern(queueObjects);

        // Return just the IDs in sorted order
        return sorted.map((q) => q.queueId);
      });

      setTotalWaitingCount((prev) => prev + 1);
    },
    [sortByPriorityPattern, globalQueueMap]
  );

  const removeFromWaitingQueue = useCallback((queueId) => {
    console.log("Global Queue Map", globalQueueMap);
    setGlobalQueueMap((prev) => {
      const newMap = new Map(prev);
      newMap.delete(queueId);
      return newMap;
    });

    setGlobalQueueIds((prev) => prev.filter((id) => id !== queueId));
    setTotalWaitingCount((prev) => Math.max(0, prev - 1));
  }, []);

  const addToDeferredQueue = useCallback((formattedQueue) => {
    setDeferredQueueMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(formattedQueue.queueId, formattedQueue);
      return newMap;
    });

    setDeferredQueueIds((prev) => {
      if (prev.includes(formattedQueue.queueId)) return prev;
      return [...prev, formattedQueue.queueId];
    });

    setTotalDeferredCount((prev) => prev + 1);
  }, []);

  const removeFromDeferredQueue = useCallback((queueId) => {
    setDeferredQueueMap((prev) => {
      const newMap = new Map(prev);
      newMap.delete(queueId);
      return newMap;
    });

    setDeferredQueueIds((prev) => prev.filter((id) => id !== queueId));
    setTotalDeferredCount((prev) => Math.max(0, prev - 1));
  }, []);

  // ==================== OPTIMIZED FETCH WITH PAGINATION ====================

  const fetchQueueList = useCallback(async () => {
    if (!selectedWindow?.id) {
      console.log("⚠️ No window assigned yet, skipping queue fetch");
      return;
    }

    try {
      setIsLoading(true);

      // ✅ Fetch WAITING queues with pagination
      const waitingQueues = await getQueueListByStatus(Status.WAITING, {
        limit: INITIAL_LOAD,
        offset: 0,
        include_total: true,
      });
      console.log("Fetched waiting queues:", waitingQueues);
      // const waitingQueues = await getQueueListByStatus(Status.WAITING);

      if (waitingQueues?.queues && Array.isArray(waitingQueues.queues)) {
        const formattedQueue = waitingQueues.queues.map(formatQueueData);
        const sortedQueue = sortByPriorityPattern(formattedQueue);

        // Populate Map and IDs
        const newMap = new Map();
        const newIds = [];
        sortedQueue.forEach((queue) => {
          newMap.set(queue.queueId, queue);
          newIds.push(queue.queueId);
        });

        setGlobalQueueMap(newMap);
        setGlobalQueueIds(newIds);
        setTotalWaitingCount(
          waitingQueues?.pagination?.total || sortedQueue.length
        );
        console.log(sortedQueue.length, "waiting queues loaded.");
        setHasMoreWaiting(
          newIds.length < (waitingQueues?.pagination?.total || 0)
        );
      } else if (Array.isArray(waitingQueues)) {
        // Fallback for old API format (no pagination)
        const formattedQueue = waitingQueues.map(formatQueueData);
        const sortedQueue = sortByPriorityPattern(formattedQueue);

        const newMap = new Map();
        const newIds = [];
        sortedQueue.forEach((queue) => {
          newMap.set(queue.queueId, queue);
          newIds.push(queue.queueId);
        });

        setGlobalQueueMap(newMap);
        setGlobalQueueIds(newIds);
        setTotalWaitingCount(sortedQueue.length);
        setHasMoreWaiting(false);
      }

      // ✅ Fetch DEFERRED queues with pagination
      // const deferredQueues = await getDeferredQueue(Status.DEFERRED, {
      //   limit: INITIAL_LOAD,
      //   offset: 0,
      //   include_total: true,
      // });
      const deferredQueues = await getQueueListByStatus(Status.DEFERRED, {
        // requestStatus: [Status.STALLED, Status.SKIPPED],
        limit: INITIAL_LOAD,
        offset: 0,
        include_total: true,
      });

      if (deferredQueues?.queues && Array.isArray(deferredQueues.queues)) {
        const formattedDeferred = deferredQueues.queues.map(formatQueueData);

        const deferredMap = new Map();
        const deferredIds = [];
        formattedDeferred.forEach((queue) => {
          deferredMap.set(queue.queueId, queue);
          deferredIds.push(queue.queueId);
        });

        setDeferredQueueMap(deferredMap);
        setDeferredQueueIds(deferredIds);
        setTotalDeferredCount(deferredQueues.total || formattedDeferred.length);
        setHasMoreDeferred(deferredIds.length < (deferredQueues.total || 0));
      } else if (Array.isArray(deferredQueues)) {
        // Fallback for old API format
        const formattedDeferred = deferredQueues.map(formatQueueData);

        const deferredMap = new Map();
        const deferredIds = [];
        formattedDeferred.forEach((queue) => {
          deferredMap.set(queue.queueId, queue);
          deferredIds.push(queue.queueId);
        });

        setDeferredQueueMap(deferredMap);
        setDeferredQueueIds(deferredIds);
        setTotalDeferredCount(formattedDeferred.length);
        setHasMoreDeferred(false);
      }
    } catch (error) {
      console.error("Error in fetching queue data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWindow?.id, sortByPriorityPattern, formatQueueData, Status]);

  // ==================== LOAD MORE FUNCTIONS ====================
  const loadMoreWaitingQueues = useCallback(async () => {
    if (isFetchingRef.current || !hasMoreWaiting || isLoading) return;

    isFetchingRef.current = true; // 🔒 Lock fetch
    setNextInlineLoading(true);

    try {
      console.log("Loading more waiting queues...");
      const response = await getQueueListByStatus(Status.WAITING, {
        limit: LOAD_MORE_SIZE,
        offset: globalQueueIds.length,
      });

      await new Promise((res) => setTimeout(res, 1000));
      const queues = response?.queues || response;

      if (!Array.isArray(queues) || queues.length === 0) {
        console.log("No queues returned from API. Disabling further loads.");
        setHasMoreWaiting(false);
        return;
      }

      const formattedQueue = queues.map(formatQueueData);

      setGlobalQueueMap((prevMap) => {
        const newMap = new Map(prevMap);
        formattedQueue.forEach((q) => newMap.set(String(q.queueId), q));

        const mergedQueues = Array.from(newMap.values());
        const sortedQueues = sortByPriorityPattern(mergedQueues);
        const sortedIds = sortedQueues.map((q) => String(q.queueId));

        const receivedAll = queues.length < LOAD_MORE_SIZE;
        const reachedTotal = sortedIds.length >= totalWaitingCount;

        const prevSize = prevMap.size;
        const newSize = newMap.size;
        const addedCount = newSize - prevSize;

        // 🧩 new hard guard here:
        if (addedCount <= 0) {
          console.log("⚠️ No new queues added — stopping further loads.");
          setHasMoreWaiting(false);
          return prevMap; // prevent redundant updates
        }

        const shouldHaveMore = !(receivedAll || reachedTotal);
        setGlobalQueueIds(sortedIds);
        setHasMoreWaiting(shouldHaveMore);

        console.log({
          received: queues.length,
          requested: LOAD_MORE_SIZE,
          prevSize,
          newSize,
          addedCount,
          currentTotal: sortedIds.length,
          serverTotal: totalWaitingCount,
          hasMore: shouldHaveMore,
        });

        return newMap;
      });
    } catch (error) {
      console.error("Error loading more waiting queues:", error);
      setHasMoreWaiting(false);
    } finally {
      setNextInlineLoading(false);
      isFetchingRef.current = false; // 🔓 Unlock fetch
    }
  }, [
    hasMoreWaiting,
    isLoading,
    totalWaitingCount,
    formatQueueData,
    sortByPriorityPattern,
    Status,
    globalQueueIds.length,
  ]);

  // console.log("Global Queue Map: ", globalQueueMap);
  const loadMoreDeferredQueues = useCallback(async () => {
    if (!hasMoreDeferred || isLoading) return;

    try {
      const response = await getQueueListByStatus(Status.DEFERRED, {
        requestStatus: [Status.STALLED, Status.SKIPPED],
        limit: LOAD_MORE_SIZE,
        offset: deferredQueueIds.length,
      });

      const queues = response?.queues || response;
      if (Array.isArray(queues) && queues.length > 0) {
        const formattedDeferred = queues.map(formatQueueData);

        setDeferredQueueMap((prev) => {
          const newMap = new Map(prev);
          formattedDeferred.forEach((queue) =>
            newMap.set(queue.queueId, queue)
          );
          return newMap;
        });

        setDeferredQueueIds((prev) => [
          ...prev,
          ...formattedDeferred.map((q) => q.queueId),
        ]);
        setHasMoreDeferred(
          deferredQueueIds.length + formattedDeferred.length <
            totalDeferredCount
        );
      }
    } catch (error) {
      console.error("Error loading more deferred queues:", error);
    }
  }, [
    hasMoreDeferred,
    isLoading,
    deferredQueueIds.length,
    totalDeferredCount,
    formatQueueData,
    Status,
  ]);

  // ==================== SOCKET EVENT HANDLERS (OPTIMIZED) ====================
  const handleFetchQueue = useCallback(async (data, options = {}) => {
    try {
      const fetchedQueue = await getSingleQueue(data.queueId, options);
      console.log("Fetched Queue Response:", fetchedQueue);
      if (!fetchedQueue) throw new Error("There was a problem fetching queue!");
      const formattedQueue = formatQueueData(fetchedQueue);
      if (!formattedQueue)
        throw new Error("There was a problem formmatting queue!");
      return formattedQueue;
    } catch (error) {
      console.log("Error: ", error);
    }
  });

  // ✅ Define all handlers with useCallback at the top level
  const addSingleQueue = useCallback(
    async (data) => {
      try {
        const queueData = await handleFetchQueue(data, {
          status: Status.WAITING,
        });
        if (!queueData) return;
        // Update both states in sequence
        setGlobalQueueMap((prevMap) => {
          const newMap = new Map(prevMap);
          newMap.set(queueData.queueId, queueData);

          // Also update the IDs list with the new sorted order
          const allQueues = Array.from(newMap.values());
          const sortedQueues = sortByPriorityPattern(allQueues);
          const sortedIds = sortedQueues.map((q) => q.queueId);
          // Set the IDs synchronously
          // setGlobalQueueIds(sortedIds);
          setGlobalQueueIds(sortedIds.map(String));

          return newMap;
        });

        setTotalWaitingCount((prev) => prev + 1);
      } catch (error) {
        console.error("Error adding single queue:", error);
      }
    },
    [formatQueueData, sortByPriorityPattern]
  );
  const handleQueueCreated = useCallback(
    async (notification) => {
      if (!socket || !isConnected || !selectedWindow?.id) return;
      if (globalQueueIds.length < INITIAL_LOAD) {
        const newAdd = await addSingleQueue(notification);
        // console.log("New Added", newAdd);
      } else {
        // Just update count, don't add to list
        setTotalWaitingCount((prev) => prev + 1);
        console.log("Total Waiting Count incremented.", totalWaitingCount);
        console.log(
          "Queue created but not added to list due to pagination limits."
        );
      }
    },
    [
      socket,
      isConnected,
      selectedWindow?.id,
      globalQueueIds.length,
      showToast,
      addSingleQueue,
    ]
  );

  const removeFromList = useCallback((queueData) => {
    try {
      const queueId = String(queueData.queueId);
      removeFromWaitingQueue(queueId);
      removeFromDeferredQueue(queueId);
    } catch (error) {
      console.log("An error occurred.", error);
    }
  });
  const handleQueueRemoved = useCallback(
    (data) => {
      removeFromList(data);
    },
    [removeFromList]
  );

  const handleDeferredQueue = useCallback(
    async (data) => {
      const queueData = await handleFetchQueue(data, {
        status: Status.DEFERRED,
        // requestStatus: [Status.STALLED, Status.SKIPPED],
      });
      console.log("QueueData", queueData);
      showToast(`Queue (${queueData.queueNo}) deferred`, "warning");
      removeFromList(data.queueId);
      if (!deferredQueueMap.has(queueData.queueId)) {
        addToDeferredQueue(queueData);
      }
    },
    [
      handleFetchQueue,
      showToast,
      removeFromList,
      deferredQueueMap,
      addToDeferredQueue,
    ]
  );

  const handleCompleted = useCallback(
    (data) => {
      removeFromList(data);
    },
    [removeFromList]
  );

  const handleCancelled = useCallback(
    (data) => {
      removeFromList(data);
    },
    [removeFromList]
  );

  const handlePartiallyCompleted = useCallback(
    (data) => {
      removeFromList(data);
    },
    [removeFromList]
  );

  // console.log("SelectedQueue: ", selectedQueue);
  const handleDeferredRequestUpdated = useCallback(
    (data) => {
      try {
        console.log("Deferred request updated:", data);

        setDeferredQueueMap((prev) => {
          const queueIdKey = String(data.queueId);
          const queue = prev.get(queueIdKey);
          if (!queue) {
            console.warn(
              `Queue ${queueIdKey} not found in deferredQueueMap`
            );
            return new Map(prev);
          }

          const updatedQueue = {
            ...queue,
            requests: queue.requests.map((req) =>
              req.id === data.requestId || req.requestId === data.requestId
                ? {
                    ...req,
                    status: normalizeStatusForDisplay(data.requestStatus),
                    processedBy: data.updatedRequest?.processedBy,
                    processedAt: data.updatedRequest?.processedAt,
                  }
                : req
            ),
          };
          const newMap = new Map(prev);
          newMap.set(queueIdKey, updatedQueue);
          return newMap;
        });
        // ✅ Update selected queue with better comparison
        setSelectedQueue((prev) => {
          console.log("Checking selectedQueue update:", {
            prev,
            dataQueueId: data.queueId,
            prevQueueId: prev?.queueId,
            prevId: prev?.id,
            match:
              prev?.queueId === data.queueId ||
              prev?.id === data.queueId ||
              String(prev?.queueId) === String(data.queueId) ||
              String(prev?.id) === String(data.queueId),
          });

          if (!prev || prev?.queueId !== String(data.queueId)) return prev;
          const updatedRequests = prev.requests.map((req) => {
            const isTargetRequest =
              req.id === data.requestId || req.requestId === data.requestId;

            if (isTargetRequest) {
              return {
                ...req,
                status: normalizeStatusForDisplay(data.requestStatus),
                processedBy: data.updatedRequest?.processedBy,
                processedAt: data.updatedRequest?.processedAt,
              };
            }
            return req;
          });

          return { ...prev, requests: updatedRequests };
        });
      } catch (error) {
        console.error("Error handling deferred request update:", error);
      }
    },
    [normalizeStatusForDisplay]
  );

  const handleQueueReset = useCallback(
    async (data) => {
      if (data.previousWindowId === selectedWindow?.id) {
        console.log("⏭️ Skipping reset event for own window");
        return;
      }
      try {
        const queueData = await getQueueByIdAndReference(
          data.queueId,
          data.referenceNumber
        );
        if (!queueData)
          throw new Error("Error Occurred when fetching queue data");

        const formattedResetQueue = formatQueueData(queueData);
        if (!globalQueueMap.has(queueData.queueId)) {
          addToWaitingQueue(formattedResetQueue);
        } else {
          setGlobalQueueMap((prev) => {
            const newMap = new Map(prev);
            newMap.set(queueData.queueId, formattedResetQueue);
            return newMap;
          });

          setGlobalQueueIds((prev) => {
            const queueObjects = prev
              .map((id) => globalQueueMap.get(id))
              .filter(Boolean);
            const updated = queueObjects.map((q) =>
              q.queueId === queueData.queueId ? formattedResetQueue : q
            );
            const sorted = sortByPriorityPattern(updated);
            return sorted.map((q) => q.queueId);
          });
        }

        if (currentQueue?.queueId === queueData.queueId) {
          showToast("Duplicated", "warning");
          setCurrentQueue(null);
        }

        removeFromDeferredQueue(queueData.queueId);
        showToast(
          `Queue ${formattedResetQueue.queueNo} was set to WAITING.`,
          "warning"
        );
      } catch (error) {
        console.error("Error Occurred", error);
      }
    },
    [
      selectedWindow?.id,
      globalQueueMap,
      currentQueue,
      formatQueueData,
      addToWaitingQueue,
      sortByPriorityPattern,
      removeFromDeferredQueue,
      showToast,
    ]
  );

  const handleWindowAssigned = useCallback(
    (data) => {
      console.log("🟢 Window Assigned:", data);
      showToast(data.message || "Window assigned successfully", "info");
    },
    [showToast]
  );

  const handleWindowRelease = useCallback(
    async (data) => {
      try {
        setIsLoading(true);
        if (data.previousWindowId === selectedWindow?.id) {
          setSelectedWindow(null);
          setCurrentQueue(null);
          setIsLoading(true);
          localStorage.removeItem("selectedWindow");

          showToast("Your window has been released", "info");
          await loadWindows();
          setShowWindowModal(true);
          return;
        }
        showToast(`${data.message}`, "info");
        await loadWindows();
      } catch (error) {
        console.error("Error handling window release:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedWindow?.id, loadWindows, showToast]
  );

  const handleError = useCallback(
    (error) => {
      console.error("❌ Socket Error:", error);
      showToast("Connection error occurred", "error");
      setIsLoading(false);
    },
    [showToast]
  );

  // ✅ Simplified useEffect
  useEffect(() => {
    if (!socket || !isConnected || !selectedWindow?.id) return;
    socket.on(QueueActions.QUEUE_RESET, handleQueueReset);
    socket.on(QueueActions.QUEUE_DEFERRED, handleDeferredQueue);
    socket.on(
      QueueActions.REQUEST_DEFERRED_UPDATED,
      handleDeferredRequestUpdated
    );
    socket.on(QueueActions.QUEUE_CANCELLED, handleCancelled);
    socket.on(QueueActions.QUEUE_COMPLETED, handleCompleted);
    socket.on(QueueActions.QUEUE_PARTIALLY_COMPLETE, handlePartiallyCompleted);
    socket.on(SocketEvents.QUEUE_CREATED, handleQueueCreated);
    socket.on(QueueActions.QUEUE_TAKEN, handleQueueRemoved);
    socket.on(WindowEvents.ASSIGN_WINDOW, handleWindowAssigned);
    socket.on(WindowEvents.RELEASE_WINDOW, handleWindowRelease);
    socket.on("error", handleError);

    return () => {
      socket.off(QueueActions.QUEUE_RESET, handleQueueReset);
      socket.off(QueueActions.QUEUE_DEFERRED, handleDeferredQueue);
      socket.off(QueueActions.QUEUE_CANCELLED, handleCancelled);
      socket.off(QueueActions.QUEUE_COMPLETED, handleCompleted);
      socket.off(
        QueueActions.REQUEST_DEFERRED_UPDATED,
        handleDeferredRequestUpdated
      );
      socket.off(
        QueueActions.QUEUE_PARTIALLY_COMPLETE,
        handlePartiallyCompleted
      );
      socket.off(SocketEvents.QUEUE_CREATED, handleQueueCreated);
      socket.off(QueueActions.QUEUE_TAKEN, handleQueueRemoved);
      socket.off(WindowEvents.ASSIGN_WINDOW, handleWindowAssigned);
      socket.off(WindowEvents.RELEASE_WINDOW, handleWindowRelease);
      socket.off("error", handleError);
    };
  }, [
    socket,
    isConnected,
    selectedWindow?.id,
    handleQueueCreated,
    handleQueueRemoved,
    handleDeferredQueue,
    handleCompleted,
    handleCancelled,
    handlePartiallyCompleted,
    handleDeferredRequestUpdated,
    handleQueueReset,
    handleWindowAssigned,
    handleWindowRelease,
    handleError,
  ]);
  // Initial fetch
  useEffect(() => {
    if (selectedWindow?.id && !showWindowModal) {
      fetchQueueList();
    }
  }, [selectedWindow?.id, showWindowModal, fetchQueueList]);
  useEffect(() => {
    // Don't override API-based hasMoreWaiting if we recently loaded
    if (nextInLineLoading) return;

    const shouldHaveMore = globalQueueIds.length < totalWaitingCount;

    // Only update if there's a meaningful difference
    if (hasMoreWaiting !== shouldHaveMore) {
      // If API said no more, but we have new queues, enable loading
      if (!hasMoreWaiting && shouldHaveMore) {
        setHasMoreWaiting(true);
      }
      // If we've loaded everything, disable loading
      else if (hasMoreWaiting && !shouldHaveMore) {
        setHasMoreWaiting(false);
      }
    }
  }, [
    globalQueueIds.length,
    totalWaitingCount,
    hasMoreWaiting,
    nextInLineLoading,
  ]);

  useEffect(() => {
    const lastId = globalQueueIds[globalQueueIds.length - 1];
    console.log("🔍 Last queue in list:", lastId);
    console.log("🧩 In map:", globalQueueMap.has(lastId));
  }, [globalQueueIds, globalQueueMap]);
  useEffect(() => {
    console.log({
      totalWaitingCount,
      hasMoreWaiting,
      loaded: globalQueueIds.length,
    });
  }, [totalWaitingCount, hasMoreWaiting, globalQueueIds]);
  // ==================== RETURN VALUES ====================

  // Convert Map to Array for rendering (only when needed)
  const globalQueueList = globalQueueIds
    .map((id) => globalQueueMap.get(id))
    .filter(Boolean);
  const deferredQueue = deferredQueueIds
    .map((id) => deferredQueueMap.get(id))
    .filter(Boolean);

  return {
    // State
    globalQueueList,
    globalQueueMap,
    globalQueueIds,
    totalWaitingCount,
    deferredQueue,
    deferredQueueMap,
    deferredQueueIds,
    totalDeferredCount,
    currentQueue,
    selectedQueue,
    isLoading,
    setIsLoading,
    nextInLineLoading,
    setNextInlineLoading,
    hasMoreWaiting,
    hasMoreDeferred,

    // Actions
    setCurrentQueue,
    setSelectedQueue,
    loadMoreWaitingQueues,
    loadMoreDeferredQueues,
    fetchQueueList,
  };
};

export default ManageQueueHook;
