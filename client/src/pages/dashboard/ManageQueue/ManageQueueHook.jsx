import { useCallback, useEffect, useRef, useState } from "react";
import {
  getQueueListByQuery,
  getSingleQueue,
} from "../../../api/staff.queue.api";
import { normalizeStatusForDisplay } from "../../../utils/NormalizeStatus";
import { formatQueueData } from "../../../utils/QueueDetailsFormatter";

const ManageQueueHook = ({
  socket,
  isConnected,
  showWindowModal,
  setShowWindowModal,
  stopHeartbeat,
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
  const [hasMoreWaiting, setHasMoreWaiting] = useState(true);

  const [deferredQueueMap, setDeferredQueueMap] = useState(new Map());
  const [deferredQueueIds, setDeferredQueueIds] = useState([]);
  const [totalDeferredCount, setTotalDeferredCount] = useState(0);
  const [hasMoreDeferred, setHasMoreDeferred] = useState(true);

  const [filteredDeferredQueueIds, setFilteredDeferredQueueIds] = useState([]);
  const [filteredDeferredQueueMap, setFilteredDeferredQueueMap] = useState(
    new Map()
  );
  const [hasMoreFilteredDeferred, setHasMoreFilteredDeferred] = useState(true);
  const [totalFilteredDeferredCount, setTotalFilteredDeferredCount] =
    useState(0);
  const [statusFilter, setStatusFilter] = useState([]);
  const isFilteringDeferred = statusFilter.length > 0;

  const [waitingSearchMap, setWaitingSearchMap] = useState(new Map());
  const [waitingSearchIds, setWaitingSearchIds] = useState([]);
  const [isWaitingSearchMode, setIsWaitingSearchMode] = useState(false);
  const [waitingSearchTotal, setWaitingSearchTotal] = useState(0);
  const [hasMoreWaitingSearch, setHasMoreWaitingSearch] = useState(false);

  const [deferredSearchMap, setDeferredSearchMap] = useState(new Map());
  const [deferredSearchIds, setDeferredSearchIds] = useState([]);
  const [isDeferredSearchMode, setIsDeferredSearchMode] = useState(false);
  const [deferredSearchTotal, setDeferredSearchTotal] = useState(0);
  const [hasMoreDeferredSearch, setHasMoreDeferredSearch] = useState(false);

  const waitingSearchValueRef = useRef("");
  const deferredSearchValueRef = useRef("");
  const filterTimeoutRef = useRef(null);
  const currentFilterRequestRef = useRef(null);
  const lastFilterRef = useRef([]);

  const [currentQueue, setCurrentQueue] = useState(null);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [nextInLineLoading, setNextInlineLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeferredLoading, setIsDeferredLoading] = useState(false);

  const isFetchingRef = useRef(false);
  const INITIAL_LOAD = 100;
  const LOAD_MORE_SIZE = 50;
  // const [hasMoreWaiting, setHasMoreWaiting] = useState(true);
  // const [hasMoreDeferred, setHasMoreDeferred] = useState(true);

  // ==================== HELPER FUNCTIONS ====================
  const sortByPriorityPattern = useCallback((queues) => {
    // console.log("🔢 Starting sort with queues:", queues?.length);
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

  const filterDeferredRequests = useCallback((queue) => {
    const filtered =
      queue.requests?.filter((req) => {
        const status = req.status?.toLowerCase();
        return (
          status === Status.STALLED.toLowerCase() ||
          status === Status.SKIPPED.toLowerCase()
        );
      }) || [];
    return {
      ...queue,
      requests: filtered,
    };
  }, []);
  const mapStatusToEnum = (statusString) => {
    const statusMap = {
      stalled: Status.STALLED,
      skipped: Status.SKIPPED,
    };
    return statusMap[statusString.toLowerCase()];
  };

  const toggleStatusFilter = useCallback((status) => {
    if (currentFilterRequestRef.current) {
      currentFilterRequestRef.current.abort();
      currentFilterRequestRef.current = null;
    }
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
      filterTimeoutRef.current = null;
    }
    setStatusFilter((prev) => {
      const newFilter = prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status];

      return newFilter;
    });
  }, []);

  const addToWaitingQueue = useCallback(
    (formattedQueue) => {
      console.log(
        "🔵 addToWaitingQueue called for queue:",
        formattedQueue.queueId
      );

      // Check BEFORE updating - using current state
      const wasNew = !globalQueueMap.has(formattedQueue.queueId);
      console.log("🔍 Queue was new?", wasNew);

      setGlobalQueueMap((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(formattedQueue.queueId, formattedQueue);

        // Update IDs based on the new map
        const queueObjects = Array.from(newMap.values());
        const sorted = sortByPriorityPattern(queueObjects);
        setGlobalQueueIds(sorted.map((q) => q.queueId));

        return newMap;
      });

      // Increment OUTSIDE the setter, only once
      if (wasNew) {
        console.log("✅ Incrementing totalWaitingCount");
        setTotalWaitingCount((prev) => {
          console.log(
            "📊 Previous count:",
            prev,
            "New count:",
            (prev || 0) + 1
          );
          return (prev || 0) + 1;
        });
      }
    },
    [globalQueueMap, sortByPriorityPattern]
  );

  const removeFromWaitingQueue = useCallback((queueId) => {
    setGlobalQueueMap((prev) => {
      const newMap = new Map(prev);
      const wasDeleted = newMap.delete(queueId);
      console.log(
        `🗑️ Removed from waiting: ${queueId}, existed: ${wasDeleted}`
      );
      return newMap;
    });

    setGlobalQueueIds((prev) => {
      const newIds = prev.filter((id) => id !== queueId);
      console.log(`📋 Waiting IDs after removal: ${newIds.length}`);
      return newIds;
    });

    setTotalWaitingCount((prev) => {
      const newCount = Math.max(0, prev - 1);
      console.log(`🔢 Total waiting count: ${prev} → ${newCount}`);
      return newCount;
    });
  }, []);
  const updateQueueInMaps = useCallback(
    (queue) => {
      const filteredQueue = filterDeferredRequests(queue);
      const queueId = String(queue.queueId);

      // Check if this queue should be in deferred based on its current status
      const shouldBeInDeferred =
        filteredQueue.requests && filteredQueue.requests.length > 0;

      // Check if this queue should be in the current filter
      const shouldBeInFilter =
        statusFilter.length > 0 &&
        filteredQueue.requests?.some((req) =>
          statusFilter.includes(req.status?.toLowerCase())
        );

      console.log(`🔄 Updating queue ${queueId}:`, {
        shouldBeInDeferred,
        shouldBeInFilter,
        currentStatusFilter: statusFilter,
        queueRequests: filteredQueue.requests?.map((r) => ({
          id: r.id,
          status: r.status,
        })),
      });

      // Update main deferred map
      setDeferredQueueMap((prev) => {
        const newMap = new Map(prev);

        if (shouldBeInDeferred) {
          newMap.set(queueId, filteredQueue);
        } else {
          // Remove from deferred if no longer has deferred requests
          newMap.delete(queueId);
        }

        return newMap;
      });

      // Update deferred IDs list
      setDeferredQueueIds((prev) => {
        if (shouldBeInDeferred && !prev.includes(queueId)) {
          return [...prev, queueId];
        } else if (!shouldBeInDeferred) {
          return prev.filter((id) => id !== queueId);
        }
        return prev;
      });

      // Update filtered deferred map
      setFilteredDeferredQueueMap((prev) => {
        const newMap = new Map(prev);

        if (shouldBeInFilter) {
          newMap.set(queueId, filteredQueue);
        } else {
          // Remove from filtered view if no longer matches filter
          newMap.delete(queueId);
        }

        return newMap;
      });

      // Update filtered deferred IDs list
      setFilteredDeferredQueueIds((prev) => {
        if (shouldBeInFilter && !prev.includes(queueId)) {
          return [...prev, queueId];
        } else if (!shouldBeInFilter) {
          return prev.filter((id) => id !== queueId);
        }
        return prev;
      });

      // Update search maps
      setDeferredSearchMap((prev) => {
        const newMap = new Map(prev);
        if (newMap.has(queueId)) {
          if (shouldBeInDeferred) {
            newMap.set(queueId, filteredQueue);
          } else {
            newMap.delete(queueId);
          }
        }
        return newMap;
      });

      // Also update total counts
      if (!shouldBeInDeferred && deferredQueueMap.has(queueId)) {
        setTotalDeferredCount((prev) => Math.max(0, prev - 1));
      }
      if (!shouldBeInFilter && filteredDeferredQueueMap.has(queueId)) {
        setTotalFilteredDeferredCount((prev) => Math.max(0, prev - 1));
      }
    },
    [
      filterDeferredRequests,
      statusFilter,
      deferredQueueMap,
      filteredDeferredQueueMap,
    ]
  );

  const addToDeferredQueue = useCallback(
    (formattedQueue) => {
      const filteredQueue = filterDeferredRequests(formattedQueue);
      if (!filteredQueue.requests || filteredQueue.requests.length === 0)
        return;

      // ✅ Use updateQueueInMaps for consistent updates
      updateQueueInMaps(formattedQueue);

      // ✅ Only handle the additional logic that updateQueueInMaps doesn't cover
      setDeferredQueueIds((prev) => {
        if (prev.includes(filteredQueue.queueId)) return prev;
        return [...prev, filteredQueue.queueId];
      });

      setTotalDeferredCount((prev) => prev + 1);

      console.log(`✅ Added to deferred: ${filteredQueue.queueNo}`);
    },
    [filterDeferredRequests, updateQueueInMaps] // ✅ Add updateQueueInMaps dependency
  );

  const removeFromDeferredQueue = useCallback((queueId) => {
    setDeferredQueueMap((prev) => {
      const newMap = new Map(prev);
      newMap.delete(queueId);
      return newMap;
    });

    setDeferredQueueIds((prev) => prev.filter((id) => id !== queueId));
    setTotalDeferredCount((prev) => Math.max(0, prev - 1));
  }, []);

  // ==================== HANDLE FETCH FUNCTIONS ====================

  const fetchQueueList = useCallback(async () => {
    if (!selectedWindow?.id) {
      console.log("⚠️ No window assigned yet, skipping queue fetch");
      return;
    }

    try {
      setIsLoading(true);
      const waitingQueues = await getQueueListByQuery(Status.WAITING, {
        limit: INITIAL_LOAD,
        offset: 0,
        include_total: true,
      });
      console.log("Fetched waiting queues:", waitingQueues);
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
        console.log("Waiting Queues Total: ", waitingQueues?.pagination?.total);
        setTotalWaitingCount(waitingQueues?.pagination?.total || 0);
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
      const deferredQueues = await getQueueListByQuery(Status.DEFERRED, {
        requestStatus: [Status.STALLED, Status.SKIPPED],
        limit: INITIAL_LOAD,
        offset: 0,
        include_total: true,
      });
      console.log("Deferred Queues:", deferredQueues);
      if (deferredQueues?.queues && Array.isArray(deferredQueues.queues)) {
        // Apply filtering here
        const formattedDeferred = deferredQueues.queues
          .map(formatQueueData)
          .map(filterDeferredRequests);

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
        // Apply filtering here
        const formattedDeferred = deferredQueues
          .map(formatQueueData)
          .map(filterDeferredRequests);

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

  const handleWaitingSearch = useCallback(
    async (searchValue) => {
      const trimmedSearch = searchValue?.trim() || "";
      waitingSearchValueRef.current = trimmedSearch;

      if (!trimmedSearch) {
        // Clear search mode - return to main list
        setIsWaitingSearchMode(false);
        setWaitingSearchMap(new Map());
        setWaitingSearchIds([]);
        setWaitingSearchTotal(0);
        setHasMoreWaitingSearch(false);
        return;
      }

      setIsWaitingSearchMode(true);
      setNextInlineLoading(true);

      try {
        const response = await getQueueListByQuery(Status.WAITING, {
          limit: INITIAL_LOAD,
          offset: 0,
          searchValue: trimmedSearch,
          include_total: true,
        });

        const queues = response?.queues || response;
        if (Array.isArray(queues)) {
          const formatted = queues.map(formatQueueData);
          const sorted = sortByPriorityPattern(formatted);

          const newMap = new Map();
          const newIds = [];
          sorted.forEach((q) => {
            newMap.set(q.queueId, q);
            newIds.push(q.queueId);
          });

          setWaitingSearchMap(newMap);
          setWaitingSearchIds(newIds);
          setWaitingSearchTotal(response?.pagination?.total || sorted.length);
          setHasMoreWaitingSearch(
            newIds.length < (response?.pagination?.total || 0)
          );
        }
      } catch (error) {
        console.error("Waiting search error:", error);
      } finally {
        setNextInlineLoading(false);
      }
    },
    [formatQueueData, sortByPriorityPattern, Status]
  );

  const handleDeferredSearch = useCallback(
    async (searchValue) => {
      const trimmedSearch = searchValue?.trim() || "";
      deferredSearchValueRef.current = trimmedSearch;

      if (!trimmedSearch) {
        setIsDeferredSearchMode(false);
        setDeferredSearchMap(new Map());
        setDeferredSearchIds([]);
        setDeferredSearchTotal(0);
        setHasMoreDeferredSearch(false);
        return;
      }

      setIsDeferredSearchMode(true);
      setIsDeferredLoading(true);

      try {
        const requestStatus =
          statusFilter.length > 0
            ? statusFilter.map((s) => mapStatusToEnum(s)).filter(Boolean)
            : [Status.STALLED, Status.SKIPPED];

        console.log("🔍 Deferred search with:", {
          searchValue: trimmedSearch,
          statusFilter,
          requestStatus,
        });

        const response = await getQueueListByQuery(Status.DEFERRED, {
          requestStatus: requestStatus,
          limit: INITIAL_LOAD,
          offset: 0,
          searchValue: trimmedSearch,
          include_total: true,
        });

        const queues = response?.queues || response;
        if (Array.isArray(queues)) {
          const formattedDeferred = queues
            .map(formatQueueData)
            .map(filterDeferredRequests);

          const newMap = new Map();
          const newIds = [];
          formattedDeferred.forEach((q) => {
            newMap.set(q.queueId, q);
            newIds.push(q.queueId);
          });

          setDeferredSearchMap(newMap);
          setDeferredSearchIds(newIds);
          setDeferredSearchTotal(
            response?.pagination?.total || formattedDeferred.length
          );
          setHasMoreDeferredSearch(
            newIds.length < (response?.pagination?.total || 0)
          );
        }
      } catch (error) {
        console.error("Deferred search error:", error);
      } finally {
        setIsDeferredLoading(false);
      }
    },
    [formatQueueData, Status, statusFilter, filterDeferredRequests] // ✅ Add statusFilter dependency
  );

  const handleFetchQueue = useCallback(async (data, options = {}) => {
    try {
      console.log("data", data);
      const fetchedQueue = await getSingleQueue(
        data.queueId,
        data.referenceNumber,
        options
      );
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

  // ==================== LOAD MORE FUNCTIONS ====================
  const loadMoreWaitingQueues = useCallback(async () => {
    if (isFetchingRef.current || !hasMoreWaiting || isLoading) return;

    isFetchingRef.current = true; // 🔒 Lock fetch
    setNextInlineLoading(true);

    try {
      console.log("Loading more waiting queues...");
      const response = await getQueueListByQuery(Status.WAITING, {
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
  const loadMoreDeferredQueues = useCallback(async () => {
    if (!hasMoreDeferred || isLoading) return;
    setIsDeferredLoading(true);
    try {
      const queryParams = {
        limit: LOAD_MORE_SIZE,
        offset: deferredQueueIds.length,
      };
      const response = await getQueueListByQuery(Status.DEFERRED, queryParams);
      const queues = response?.queues || response;
      if (Array.isArray(queues) && queues.length > 0) {
        const formattedDeferred = queues
          .map(formatQueueData)
          .map(filterDeferredRequests);

        setDeferredQueueMap((prev) => {
          const newMap = new Map(); // <-- reset
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
    } finally {
      setIsDeferredLoading(false);
    }
  }, [
    hasMoreDeferred,
    isLoading,
    deferredQueueIds.length,
    totalDeferredCount,
    formatQueueData,
    filterDeferredRequests,
    Status,
    statusFilter,
  ]);
  const loadMoreWaitingSearch = useCallback(async () => {
    if (!hasMoreWaitingSearch || !isWaitingSearchMode || isLoading) return;

    setNextInlineLoading(true);
    try {
      const response = await getQueueListByQuery(Status.WAITING, {
        limit: LOAD_MORE_SIZE,
        offset: waitingSearchIds.length,
        searchValue: waitingSearchValueRef.current,
        include_total: true,
      });

      const queues = response?.queues || response;
      if (Array.isArray(queues) && queues.length > 0) {
        const formatted = queues.map(formatQueueData);

        setWaitingSearchMap((prev) => {
          const newMap = new Map(prev);
          formatted.forEach((q) => newMap.set(q.queueId, q));
          return newMap;
        });

        setWaitingSearchIds((prev) => [
          ...prev,
          ...formatted.map((q) => q.queueId),
        ]);

        setHasMoreWaitingSearch(
          waitingSearchIds.length + formatted.length < waitingSearchTotal
        );
      } else {
        setHasMoreWaitingSearch(false);
      }
    } catch (error) {
      console.error("Error loading more waiting search results:", error);
    } finally {
      setNextInlineLoading(false);
    }
  }, [
    hasMoreWaitingSearch,
    isWaitingSearchMode,
    isLoading,
    waitingSearchIds.length,
    waitingSearchTotal,
    formatQueueData,
    Status,
  ]);
  const loadMoreDeferredSearch = useCallback(async () => {
    if (!hasMoreDeferredSearch || !isDeferredSearchMode || isLoading) return;
    setIsDeferredLoading(true);
    try {
      const requestStatus =
        statusFilter.length > 0
          ? statusFilter.map((s) => mapStatusToEnum(s)).filter(Boolean)
          : [Status.STALLED, Status.SKIPPED];

      const response = await getQueueListByQuery(Status.DEFERRED, {
        requestStatus: requestStatus,
        limit: LOAD_MORE_SIZE,
        offset: deferredSearchIds.length,
        searchValue: deferredSearchValueRef.current,
        include_total: true,
      });

      const queues = response?.queues || response;
      if (Array.isArray(queues) && queues.length > 0) {
        const formattedDeferred = queues
          .map(formatQueueData)
          .map(filterDeferredRequests);

        setDeferredSearchMap((prev) => {
          const newMap = new Map(prev);
          formattedDeferred.forEach((q) => newMap.set(q.queueId, q));
          return newMap;
        });

        setDeferredSearchIds((prev) => [
          ...prev,
          ...formattedDeferred.map((q) => q.queueId),
        ]);

        setHasMoreDeferredSearch(
          deferredSearchIds.length + formattedDeferred.length <
            deferredSearchTotal
        );
      } else {
        setHasMoreDeferredSearch(false);
      }
    } catch (error) {
      console.error("Error loading more deferred search results:", error);
    } finally {
      setIsDeferredLoading(false);
    }
  }, [
    hasMoreDeferredSearch,
    isDeferredSearchMode,
    isLoading,
    deferredSearchIds.length,
    deferredSearchTotal,
    formatQueueData,
    filterDeferredRequests,
    Status,
    statusFilter,
  ]);
  const loadMoreFilteredDeferredQueues = useCallback(async () => {
    if (!hasMoreFilteredDeferred || isLoading) return;
    setIsDeferredLoading(true);
    try {
      const mappedStatusFilter = statusFilter
        .map((status) => mapStatusToEnum(status))
        .filter(Boolean);

      if (mappedStatusFilter.length === 0) {
        setHasMoreFilteredDeferred(false);
        return;
      }

      const currentOffset = await new Promise((resolve) => {
        setFilteredDeferredQueueIds((prev) => {
          resolve(prev.length);
          return prev;
        });
      });
      const response = await getQueueListByQuery(Status.DEFERRED, {
        requestStatus: mappedStatusFilter,
        limit: LOAD_MORE_SIZE,
        offset: currentOffset,
      });

      const queues = response?.queues || response;
      const total = response?.pagination?.total || 0;

      if (Array.isArray(queues) && queues.length > 0) {
        const formattedDeferred = queues
          .map(formatQueueData)
          .map(filterDeferredRequests);

        setFilteredDeferredQueueMap((prev) => {
          const newMap = new Map(prev);
          formattedDeferred.forEach((queue) =>
            newMap.set(queue.queueId, queue)
          );
          return newMap;
        });

        setFilteredDeferredQueueIds((prev) => [
          ...prev,
          ...formattedDeferred.map((q) => q.queueId),
        ]);
        setFilteredDeferredQueueIds((prev) => {
          const newTotalLoaded = prev.length;
          setHasMoreFilteredDeferred(newTotalLoaded < total);
          return prev;
        });

        if (total > 0) {
          setTotalFilteredDeferredCount(total);
        }
      } else {
        setHasMoreFilteredDeferred(false);
      }
    } catch (error) {
      console.error("Error loading filtered deferred queues:", error);
      setHasMoreFilteredDeferred(false);
    } finally {
      setIsDeferredLoading(false);
    }
  }, [
    hasMoreFilteredDeferred,
    isLoading,
    statusFilter,
    formatQueueData,
    filterDeferredRequests,
    // ✅ Removed filteredDeferredQueueIds.length
  ]);

  // ==================== SOCKET EVENT HANDLERS (OPTIMIZED) ====================

  const addSingleQueue = useCallback(
    async (data) => {
      try {
        const queueData = await handleFetchQueue(data);
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

  const removeFromFilteredDeferred = useCallback((queueId) => {
    setFilteredDeferredQueueMap((prev) => {
      const newMap = new Map(prev);
      newMap.delete(queueId);
      return newMap;
    });

    setFilteredDeferredQueueIds((prev) => prev.filter((id) => id !== queueId));

    setTotalFilteredDeferredCount((prev) => Math.max(0, prev - 1));
  }, []);

  const removeFromList = useCallback(
    (queueData) => {
      try {
        const queueId = String(queueData.queueId);

        // Check where the queue exists before removing
        const isInWaiting = globalQueueMap.has(queueId);
        const isInDeferred = deferredQueueMap.has(queueId);
        const isInFilteredDeferred = filteredDeferredQueueMap.has(queueId);
        const isInDeferredSearch = deferredSearchMap.has(queueId);

        console.log(`🗑️ Removing queue ${queueId} from:`, {
          waiting: isInWaiting,
          deferred: isInDeferred,
          filteredDeferred: isInFilteredDeferred,
          deferredSearch: isInDeferredSearch,
        });

        // Remove from waiting queue
        if (isInWaiting) {
          removeFromWaitingQueue(queueId);
        }

        // Remove from deferred queue
        if (isInDeferred) {
          removeFromDeferredQueue(queueId);
        }

        // Remove from filtered deferred view
        if (isInFilteredDeferred) {
          removeFromFilteredDeferred(queueId);
        }

        // Remove from deferred search results
        if (isInDeferredSearch) {
          setDeferredSearchMap((prev) => {
            const newMap = new Map(prev);
            newMap.delete(queueId);
            return newMap;
          });
          setDeferredSearchIds((prev) => prev.filter((id) => id !== queueId));
          setDeferredSearchTotal((prev) => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.log("An error occurred in removeFromList:", error);
      }
    },
    [
      globalQueueMap,
      deferredQueueMap,
      filteredDeferredQueueMap,
      deferredSearchMap,
      removeFromWaitingQueue,
      removeFromDeferredQueue,
      removeFromFilteredDeferred,
    ]
  );
  const handleQueueRemoved = useCallback(
    (data) => {
      removeFromList(data);
    },
    [removeFromList]
  );

  const handleDeferredQueue = useCallback(
    async (data) => {
      try {
        console.log("Handling deferred queue:", data);
        const queueData = await handleFetchQueue(data, {
          status: Status.DEFERRED,
        });
        showToast(`Queue ${queueData.queueNo} Deferred`, "warning");
        // Remove from waiting list
        removeFromList(data.queueId);
        // ✅ Use the enhanced addToDeferredQueue (now handles filter sync)
        addToDeferredQueue(queueData);
      } catch (error) {
        console.error("Error handling deferred queue:", error);
      }
    },
    [
      handleFetchQueue,
      showToast,
      removeFromList,
      addToDeferredQueue, // ✅ Now this handles everything
    ]
  );

  const handleCompleted = useCallback(
    (data) => {
      try {
        const hasSufficientData = data.requests || data.status || data.queueNo;
        if (hasSufficientData) {
          updateQueueInMaps(data);
        } else {
          removeFromList(data);
        }
      } catch (error) {
        console.error("Error handling completed queue:", error);
        removeFromList(data);
      }
    },
    [updateQueueInMaps, removeFromList]
  );

  const handleCancelled = useCallback(
    (data) => {
      try {
        const hasSufficientData = data.requests || data.status || data.queueNo;
        if (hasSufficientData) {
          updateQueueInMaps(data);
        } else {
          removeFromList(data);
        }
      } catch (error) {
        console.error("Error handling completed queue:", error);
        removeFromList(data);
      }
    },
    [updateQueueInMaps, removeFromList]
  );

  const handlePartiallyCompleted = useCallback(
    (data) => {
      try {
        const hasSufficientData = data.requests || data.status || data.queueNo;
        if (hasSufficientData) {
          updateQueueInMaps(data);
        } else {
          removeFromList(data);
        }
      } catch (error) {
        console.error("Error handling completed queue:", error);
        removeFromList(data);
      }
    },
    [updateQueueInMaps, removeFromList]
  );

  const handleDeferredRequestUpdated = useCallback((data) => {
    try {
      console.log("Deferred request updated:", data);

      setDeferredQueueMap((prev) => {
        const queueIdKey = String(data.queueId);
        const queue = prev.get(queueIdKey);
        if (!queue) {
          console.warn(`Queue ${queueIdKey} not found in deferredQueueMap`);
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
  }, []);

  const handleQueueReset = useCallback(
    async (data) => {
      console.log("🔄 handleQueueReset called", data);

      if (data.previousWindowId === selectedWindow?.id) {
        console.log("⏭️ Skipping reset event for own window");
        return;
      }
      try {
        const queueData = await getSingleQueue(
          data.queueId,
          data.referenceNumber
        );
        if (!queueData)
          throw new Error("Error Occurred when fetching queue data");

        const formattedResetQueue = formatQueueData(queueData);

        console.log("📍 Queue status check:");
        console.log(
          "  - In globalQueueMap?",
          globalQueueMap.has(formattedResetQueue.queueId)
        );
        console.log(
          "  - In deferredQueueMap?",
          deferredQueueMap.has(formattedResetQueue.queueId)
        );

        if (!globalQueueMap.has(formattedResetQueue.queueId)) {
          console.log("➕ Adding to waiting queue");
          addToWaitingQueue(formattedResetQueue);
        } else {
          console.log("✅ Queue already in waiting list");
        }

        if (currentQueue?.queueId === queueData.queueId) {
          setCurrentQueue(null);
        }

        console.log("🗑️ Removing from deferred queue");
        removeFromDeferredQueue(queueData.queueId);

        showToast(
          `Queue ${formattedResetQueue.queueNo} was sent back to waiting list.`,
          "warning"
        );
      } catch (error) {
        console.error("Error Occurred", error);
      }
    },
    [
      selectedWindow?.id,
      globalQueueMap,
      deferredQueueMap,
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
      console.log("Window Assigned:", data);
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
          if (stopHeartbeat) stopHeartbeat();
          localStorage.removeItem("selectedWindow");
          console.log("Window Release data", data);
          if (data.releasedByAdmin) {
            showToast(`Window released by an Admin.`, "success");
          } else {
            showToast(`Your window has been successfully released.`, "success");
          }
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
      console.error("Socket Error:", error);
      showToast("Connection error occurred", "error");
      setIsLoading(false);
    },
    [showToast]
  );

  useEffect(() => {
    if (!socket || !isConnected || !selectedWindow?.id) {
      // console.log("Stopping heartbeat update...");
      // stopHeartbeat?.();
      return;
    }
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
    // socket.on("disconnect", (reason) => {
    //   console.log("WINDOW DISCONNECTED:", reason);
    //   console.log("BOBO KABA?>");
    //   stopHeartbeat?.(); // <- Call your cleanup function here
    //   showToast("Disconnected from server", "error");
    // });
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
      // socket.off("disconnect");
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
    // console.log("🔍 Last queue in list:", lastId);
    // console.log("🧩 In map:", globalQueueMap.has(lastId));
  }, [globalQueueIds, globalQueueMap]);
  useEffect(() => {
    console.log({
      totalWaitingCount,
      hasMoreWaiting,
      loaded: globalQueueIds.length,
    });
  }, [totalWaitingCount, hasMoreWaiting, globalQueueIds]);

  useEffect(() => {
    if (currentFilterRequestRef.current) {
      currentFilterRequestRef.current.abort();
      currentFilterRequestRef.current = null;
    }
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
      filterTimeoutRef.current = null;
    }

    // Reset UI state
    setFilteredDeferredQueueIds([]);
    setFilteredDeferredQueueMap(new Map());
    setHasMoreFilteredDeferred(false);
    setTotalFilteredDeferredCount(0);

    if (statusFilter.length === 0) {
      setIsDeferredLoading(false);
      return;
    }

    setIsDeferredLoading(true);

    filterTimeoutRef.current = setTimeout(() => {
      const abortController = new AbortController();
      currentFilterRequestRef.current = abortController;

      const mappedStatusFilter = statusFilter
        .map(mapStatusToEnum)
        .filter(Boolean);

      getQueueListByQuery(
        Status.DEFERRED,
        {
          requestStatus: mappedStatusFilter,
          limit: LOAD_MORE_SIZE,
          offset: 0,
        },
        { signal: abortController.signal }
      )
        .then((response) => {
          if (abortController.signal.aborted) return;

          currentFilterRequestRef.current = null;
          const queues = response?.queues || response;
          const total = response?.pagination?.total || 0;

          if (Array.isArray(queues) && queues.length > 0) {
            const formattedDeferred = queues
              .map(formatQueueData)
              .map(filterDeferredRequests);

            setFilteredDeferredQueueMap(
              new Map(formattedDeferred.map((queue) => [queue.queueId, queue]))
            );
            setFilteredDeferredQueueIds(
              formattedDeferred.map((q) => q.queueId)
            );
            setTotalFilteredDeferredCount(total);
            setHasMoreFilteredDeferred(queues.length < total);
          } else {
            setHasMoreFilteredDeferred(false);
          }
        })
        .catch((error) => {
          if (error.name === "AbortError") return;
          console.error("Filter error:", error);
          currentFilterRequestRef.current = null;
          setHasMoreFilteredDeferred(false);
        })
        .finally(() => {
          setIsDeferredLoading(false);
        });
    }, 300);

    return () => {
      if (currentFilterRequestRef.current) {
        currentFilterRequestRef.current.abort();
      }
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
      setIsDeferredLoading(false);
    };
  }, [statusFilter, formatQueueData, filterDeferredRequests]);
  // ==================== RETURN VALUES ====================

  // Convert Map to Array for rendering (only when needed)
  const globalQueueList = globalQueueIds
    .map((id) => globalQueueMap.get(id))
    .filter(Boolean);

  const deferredQueue = deferredQueueIds
    .map((id) => deferredQueueMap.get(id))
    .filter(Boolean);

  return {
    // Main Waiting Queue
    globalQueueList: isWaitingSearchMode
      ? waitingSearchIds.map((id) => waitingSearchMap.get(id)).filter(Boolean)
      : globalQueueList,
    globalQueueMap,
    globalQueueIds,
    totalWaitingCount: isWaitingSearchMode
      ? waitingSearchTotal
      : totalWaitingCount,
    hasMoreWaiting: isWaitingSearchMode ? hasMoreWaitingSearch : hasMoreWaiting,

    // Main Deferred Queue
    deferredQueue: isDeferredSearchMode
      ? deferredSearchIds.map((id) => deferredSearchMap.get(id)).filter(Boolean)
      : statusFilter.length > 0
      ? filteredDeferredQueueIds
          .map((id) => filteredDeferredQueueMap.get(id))
          .filter(Boolean)
      : deferredQueue,
    deferredQueueMap,
    deferredQueueIds,
    totalDeferredCount: isDeferredSearchMode
      ? deferredSearchTotal
      : statusFilter.length > 0
      ? totalFilteredDeferredCount
      : totalDeferredCount,
    hasMoreDeferred: isDeferredSearchMode
      ? hasMoreDeferredSearch
      : statusFilter.length > 0
      ? hasMoreFilteredDeferred
      : hasMoreDeferred,

    // Search states
    isWaitingSearchMode,
    isDeferredSearchMode,
    isFilteringDeferred: statusFilter.length > 0,

    // Other states...
    currentQueue,
    selectedQueue,
    isLoading,
    setIsLoading,
    nextInLineLoading,
    isDeferredLoading,
    statusFilter,

    // Actions
    setCurrentQueue,
    setSelectedQueue,
    handleWaitingSearch,
    handleDeferredSearch,
    loadMoreWaitingQueues: isWaitingSearchMode
      ? loadMoreWaitingSearch
      : loadMoreWaitingQueues,
    loadMoreDeferredQueues: isDeferredSearchMode
      ? loadMoreDeferredSearch
      : statusFilter.length > 0
      ? loadMoreFilteredDeferredQueues
      : loadMoreDeferredQueues,
    fetchQueueList,
    toggleStatusFilter,
    updateQueueInMaps,
  };
};

export default ManageQueueHook;
