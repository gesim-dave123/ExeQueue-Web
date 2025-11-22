import { useVirtualizer } from "@tanstack/react-virtual";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  assignServiceWindow,
  checkAvailableWindow,
  getMyWindowAssignment,
  getWindowData,
  updateHeartbeatInterval,
} from "../../api/staff.api.js";
import DynamicModal from "../../components/modal/DynamicModal.jsx";
import { showToast } from "../../components/toast/ShowToast.jsx";
import "../../index.css";
import { useSocket } from "../../utils/hooks/useSocket.jsx";
import { formatQueueData } from "../../utils/QueueDetailsFormatter.js";
import {
  AnnounceQueue,
  handleButtonClick,
  unlockSpeech,
  useAnnounceQueueStates,
} from "../staffs/Announce_Queue.jsx";

import { SocketEvents } from "../../../../server/src/services/enums/SocketEvents.js";
import {
  currentServedQueue,
  getCallNextQueue,
  markQueueStatus,
  setDeferredRequestStatus,
  setRequestStatus,
} from "../../api/staff.queue.api.js";
import {
  LoadingSkeleton,
  MainCardSkeleton,
} from "../../components/LoadingSkeletons/LoadingSkeletonManageQueue.jsx";
import { Status } from "../../constants/queueEnums.js";
import { QueueActions, WindowEvents } from "../../constants/SocketEvents.js";
import { useDebounce } from "../../utils/hooks/useDebounce.jsx";
import ManageQueueHook from "./ManageQueue/ManageQueueHook.jsx";

export default function Manage_Queue() {
  const navigate = useNavigate();
  const parentRef = useRef(null);
  const heartbeatRef = useRef(null);
  const deferredParentRef = useRef(null);
  const autoCallInProgressRef = useRef(false);
  const [deferredOpen, setDeferredOpen] = useState(true);
  const [nextInLineOpen, setNextInLineOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deferredSearchTerm, setDeferredSearchTerm] = useState("");
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [hasCurrentServedQueue, setHasCurrentServedQueue] = useState(false);
  const [tooltipData, setTooltipData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);

  const [showWindowModal, setShowWindowModal] = useState(false);
  const [selectedWindow, setSelectedWindow] = useState({});
  const [availableWindows, setAvailableWindows] = useState([]);
  const [callingNext, setCallingNext] = useState(false);
  const [wasQueueEmpty, setWasQueueEmpty] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedDeferredSearchTerm = useDebounce(deferredSearchTerm, 500);
  const isNumeric = (val) => /^\d+$/.test(val);

  const onDisconnectOrCleanUp = () => {
    stopHeartbeat();
  };

  const { socket, isConnected } = useSocket(onDisconnectOrCleanUp);

  // Status filter toggle handler

  const DEFAULT_QUEUE = {
    queueNo: "R000",
    studentId: "N/A",
    name: "N/A",
    course: "N/A",
    type: "N/A",
    time: "N/A",
    requests: [],
  };

  const getDefaultQueue = () => DEFAULT_QUEUE;

  const {
    lastAnnounceTime,
    setLastAnnounceTime,
    disabledForSeconds,
    setDisabledForSeconds,
  } = useAnnounceQueueStates();

  const sortByPriorityPattern = useCallback((queues) => {
    if (!queues || queues.length === 0) {
      console.log("⚠️ No queues to sort");
      return [];
    }
    const priority = queues.filter((q) => {
      const type = q.type?.toUpperCase();
      return type === "PRIORITY";
    });
    const regular = queues.filter((q) => {
      const type = q.type?.toUpperCase();
      return type === Queue_Type.REGULAR.toString().toUpperCase();
    });
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

  const loadWindows = async () => {
    try {
      const windowData = await getWindowData();
      const windows = Array.isArray(windowData)
        ? windowData
        : windowData?.windows || [windowData];

      const windowIds = windows.map((w) => w.windowId);

      const assignedResponse = await checkAvailableWindow(windowIds);
      const availableWindows = assignedResponse?.availableWindows || [];
      const formattedWindows = windows.map((w) => {
        const isAvailable = availableWindows.includes(w.windowId);
        const firstAvailableId = availableWindows[0];

        return {
          id: w.windowId,
          name: w.windowName,
          status:
            isAvailable && w.windowId === firstAvailableId
              ? "active"
              : "inactive",
        };
      });

      setAvailableWindows(formattedWindows);
      setShowWindowModal(true);
    } catch (error) {
      console.error("Error loading windows:", error);
      setIsLoading(false);
    }
  };
  const startHeartbeatInterval = async (windowId) => {
    try {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }

      await updateHeartbeatInterval(windowId);
      heartbeatRef.current = setInterval(async () => {
        await updateHeartbeatInterval(windowId);
        console.log("Updating heartbeat...");
      }, 2 * 60 * 1000);

      console.log("Heartbeat interval activated for window Id no: ", windowId);
    } catch (error) {
      console.error(
        "Error occurred in start heartbeat interval function: ",
        error
      );
    }
  };
  function stopHeartbeat() {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }

  const {
    // Main lists (now conditionally returns search results when in search mode)
    globalQueueList, // Contains waiting queue OR search results
    deferredQueue, // Contains deferred queue OR search results
    currentQueue,
    selectedQueue,
    isLoading,
    setIsLoading,
    nextInLineLoading,
    setNextInlineLoading,

    // Total counts (automatically switches between regular and search totals)
    totalWaitingCount, // Total waiting (or search results total)
    totalDeferredCount, // Total deferred (or search results total)

    // Pagination flags (automatically switches between regular and search pagination)
    hasMoreWaiting, // Can load more waiting (or search results)
    hasMoreDeferred, // Can load more deferred (or search results)

    // 🆕 Search mode indicators
    isWaitingSearchMode, // NEW: True when searching waiting queue
    isDeferredSearchMode, // NEW: True when searching deferred queue

    // Actions
    setCurrentQueue,
    setSelectedQueue,

    // Load more functions (automatically use correct function based on search mode)
    loadMoreWaitingQueues, // Loads more waiting OR search results
    loadMoreDeferredQueues, // Loads more deferred OR search results
    statusFilter,
    toggleStatusFilter,
    fetchQueueList, // Manual refresh
    updateQueueInMaps,

    // 🆕 Search functions
    handleWaitingSearch, // NEW: Trigger waiting queue search
    handleDeferredSearch, // NEW: Trigger deferred queue search
  } = ManageQueueHook({
    socket,
    isConnected,
    showWindowModal,
    stopHeartbeat,
    setShowWindowModal,
    loadWindows,
    showToast,
    setSelectedWindow,
    selectedWindow,
    Status,
    QueueActions,
    SocketEvents,
    WindowEvents,
  });
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = (searchTerm || "").trim();

      if (isNumeric(trimmed)) {
        handleWaitingSearch(trimmed);
      } else if (trimmed === "" || trimmed.length > 1) {
        handleWaitingSearch(trimmed);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, handleWaitingSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = (deferredSearchTerm || "").trim();
      if (trimmed === "" || trimmed.length > 1) {
        handleDeferredSearch(trimmed);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [deferredSearchTerm, handleDeferredSearch]);
  const isDefaultQueue = (queue) => {
    return queue && queue.queueNo === "R000" && queue.studentId === "N/A";
  };
  const nextInLine = (globalQueueList || []).slice(0);

  const getMajorityStatus = (requests) => {
    if (!requests || requests.length === 0) return "Stalled";

    const statusCounts = requests.reduce((acc, request) => {
      const status = request.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const stalledCount = statusCounts["Stalled"] || 0;
    const skippedCount = statusCounts["Skipped"] || 0;

    return stalledCount >= skippedCount ? "Stalled" : "Skipped";
  };
  const handleCallNext = async (overrideWindow) => {
    const activeWindow = overrideWindow || selectedWindow;
    setCallingNext(true);
    try {
      if (!activeWindow?.id) {
        showToast("Please select a window first.", "error");
        return;
      }
      if (currentQueue?.queueId) {
        try {
          const markResponse = await markQueueStatus(
            currentQueue.queueId,
            currentQueue.windowId
          );

          if (!markResponse.success) {
            console.warn(
              "BLOCKING: Failed to mark previous queue:",
              markResponse.message
            );
            showToast(
              `Cannot proceed: Failed to mark ${currentQueue.queueNo} as completed. Please try again.`,
              "error"
            );
            return;
          }

          console.log(
            `✅ Previous queue marked as: ${markResponse.queue.queueStatus}`
          );
        } catch (markError) {
          console.warn("BLOCKING: Error marking previous queue:", markError);
          showToast(
            "Cannot proceed: Error updating queue status. Please try again.",
            "error"
          );
          return;
        }
      }

      const response = await getCallNextQueue(activeWindow.id);
      // console.log("Call Next Response:", response);

      if (response.status === 404 || !response.success) {
        if (response?.message?.includes("No queues left")) {
          showToast("No more queues left for today!", "info");
          setCurrentQueue(getDefaultQueue());
          setWasQueueEmpty(true);
          setHasCurrentServedQueue(false);
          return;
        }
        showToast("Failed to call next queue. Try Again", "error");
        return;
      }

      const assignedQueue = response.data;
      const formattedQueue = formatQueueData(assignedQueue);
      // setHasCurrentServedQueue(true);

      setCurrentQueue(formattedQueue);

      // ✅ The hook automatically removes from globalQueueList via socket
      // But we can also do it locally for instant feedback
      // setGlobalQueueList is handled by the hook

      // socket.emit(QueueActions.QUEUE_TAKEN, {
      //   queueId: assignedQueue.queueId,
      //   queueNo: assignedQueue.queueNo,
      //   windowId: activeWindow.id,
      // });

      AnnounceQueue(formattedQueue.queueNo, activeWindow.name);
      showToast(`Now serving ${formattedQueue.queueNo}`, "info");
    } catch (error) {
      console.error("Error in handleCallNext:", error);
      showToast("Error calling next queue.", "error");
    } finally {
      setCallingNext(false);
    }
  };

  const handleForceRefresh = async () => {
    try {
      if (!selectedWindow?.id) {
        showToast("No window selected", "error");
        return;
      }

      setIsLoading(true);

      const currentQueueResponse = await getCurrentQueueByWindow(
        selectedWindow.id
      );

      if (currentQueueResponse?.success && currentQueueResponse.queue) {
        const restoredQueue = formatQueueData(currentQueueResponse.queue);
        setCurrentQueue(restoredQueue);
        showToast("Queue synced successfully", "success");
      } else {
        setCurrentQueue(null);
        showToast("No active queue found", "info");
      }

      // ✅ Use fetchQueueList from hook
      await fetchQueueList();
    } catch (error) {
      console.error("Error force refreshing:", error);
      showToast("Failed to sync queue", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeStatusForDisplay = (backendStatus) => {
    const displayMap = {
      COMPLETED: "Completed",
      STALLED: "Stalled",
      SKIPPED: "Skipped",
      CANCELLED: "Cancelled",
      PENDING: "Pending",
      IN_PROGRESS: "In Progress",
    };
    return displayMap[backendStatus] || backendStatus;
  };

  const handleRequestAction = async (requestId, action) => {
    if (!currentQueue) return;

    const statusMap = {
      done: "Completed",
      stall: "Stalled",
      skip: "Skipped",
      cancel: "Cancelled",
    };

    const requestStatus = statusMap[action];
    if (!requestStatus) return;

    // More efficient snapshot
    const snapshot = {
      ...currentQueue,
      requests: currentQueue.requests.map((req) => ({ ...req })),
    };
    try {
      // Immediate optimistic update
      setCurrentQueue((prev) => ({
        ...prev,
        requests: prev.requests.map((req) =>
          req.id === requestId
            ? { ...req, status: normalizeStatusForDisplay(requestStatus) }
            : req
        ),
      }));
      const response = await setRequestStatus(
        currentQueue.queueId,
        requestId,
        requestStatus,
        currentQueue.windowId
      );

      if (!response.success) throw new Error(response.message);

      showToast(`Request ${normalizeStatusForDisplay(requestStatus)}`, "info");
    } catch (error) {
      console.error("❌ Action failed:", error);
      setCurrentQueue(snapshot); // Rollback
      showToast(error.message, "error");
    }
  };
  const handleDeferredAction = async (requestId, action) => {
    if (!selectedQueue) return;

    const statusMap = {
      done: "Completed",
      stall: "Stalled",
      skip: "Skipped",
      cancel: "Cancelled",
    };

    const requestStatus = statusMap[action];
    if (!requestStatus) return;

    const snapshot = {
      selectedQueue: JSON.parse(JSON.stringify(selectedQueue)),
      deferredQueue: JSON.parse(JSON.stringify(deferredQueue)),
    };

    try {
      const response = await setDeferredRequestStatus(
        selectedQueue.queueId,
        requestId,
        requestStatus,
        selectedQueue.windowId
      );

      if (!response.success)
        throw new Error(
          response.message || "Failed to update deferred request"
        );

      setSelectedQueue((prev) => ({
        ...prev,
        requests: prev.requests.map((r) =>
          r.id === requestId ? { ...r, status: requestStatus } : r
        ),
      }));
      setHasChanges(true);
      showToast(`Request updated to ${requestStatus}`, "info");
    } catch (error) {
      console.error("❌ Error updating deferred request:", error);
      setSelectedQueue(snapshot.selectedQueue);
      showToast(error.message || "Error updating deferred request", "error");
    }
  };

  const handleDonePanel = async () => {
    if (!selectedQueue) {
      setShowActionPanel(false);
      setSelectedQueue(null);
      return;
    }

    const snapshot = {
      selectedQueue: JSON.parse(JSON.stringify(selectedQueue)),
      deferredQueue: JSON.parse(JSON.stringify(deferredQueue)),
    };

    try {
      const allRequestsTerminal = selectedQueue.requests.every(
        (req) => req.status === "Completed" || req.status === "Cancelled"
      );

      if (allRequestsTerminal) {
        const markResponse = await markQueueStatus(
          selectedQueue.queueId,
          selectedQueue.windowId
        );

        if (!markResponse?.success) {
          throw new Error(
            markResponse?.message || "Failed to finalize queue status"
          );
        }
        showToast(
          `Queue ${selectedQueue.queueNo} has been finalized.`,
          "success"
        );
      } else {
        updateQueueInMaps(selectedQueue);
        showToast(
          `Queue ${selectedQueue.queueNo} has unresolved requests.`,
          "warning"
        );
      }
    } catch (error) {
      console.error("Error finalizing queue status:", error);
      setSelectedQueue(snapshot.selectedQueue);
      showToast(error.message || "Error finalizing queue status", "error");
    } finally {
      setShowActionPanel(false);
      setSelectedQueue(null);
    }
  };

  useEffect(() => {
    const restoreOrLoad = async () => {
      if (!socket || !isConnected) return;

      setIsLoading(true);
      try {
        const savedWindow = localStorage.getItem("selectedWindow");
        const currentAssignment = await getMyWindowAssignment();

        if (currentAssignment?.success && currentAssignment.assignment) {
          const assignedWindow = currentAssignment.assignment.serviceWindow;

          if (!assignedWindow) {
            console.warn("⚠️ No serviceWindow found in assignment object.");
            await loadWindows();
            return;
          }

          const restoredWindow = {
            id: assignedWindow.windowId,
            name: assignedWindow.windowName,
            status: "active",
          };

          setSelectedWindow(restoredWindow);
          localStorage.setItem(
            "selectedWindow",
            JSON.stringify(restoredWindow)
          );

          socket.emit(WindowEvents.WINDOW_JOINED, {
            windowId: restoredWindow.id,
          });

          await startHeartbeatInterval(restoredWindow.id);
          setShowWindowModal(false);

          try {
            const currentQueueResponse = await currentServedQueue(
              restoredWindow.id
            );
            console.log("Current Queue Response", currentQueueResponse);

            if (currentQueueResponse?.success && currentQueueResponse.queue) {
              setHasCurrentServedQueue(true);
              const restoredQueue = formatQueueData(currentQueueResponse.queue);
              setCurrentQueue(restoredQueue);
              console.log("✅ Restored current queue:", restoredQueue.queueNo);
              showToast(
                `Resumed ${restoredWindow.name} - Serving ${restoredQueue.queueNo}`,
                "info"
              );
            } else {
              console.log("ℹ️ No active queue found");
              setCurrentQueue(getDefaultQueue());
              setHasCurrentServedQueue(false);
              showToast(`${restoredWindow.name} has no active queue`, "info");
            }
          } catch (queueError) {
            console.warn("⚠️ Could not restore current queue:", queueError);
            setCurrentQueue(getDefaultQueue());
            showToast(`Resumed managing ${restoredWindow.name}`, "info");
          } finally {
            setIsLoading(false);
          }
          return;
        }

        await loadWindows();
      } catch (err) {
        console.error("❌ Error restoring or loading windows:", err);
        showToast("Error restoring window data", "error");
        await loadWindows();
      }
    };

    restoreOrLoad();
  }, [socket, isConnected]);

  const handleWindowSelect = async (windowId) => {
    unlockSpeech();
    try {
      const window = availableWindows.find((w) => w.id === windowId);
      if (window.status === "inactive") {
        // showToast("This window is currently occupied/inactive", "error");
        return;
      }

      const response = await assignServiceWindow(windowId);
      console.log("Response: Window Select", response);
      if (response?.success) {
        const window = availableWindows.find((w) => w.id === windowId);
        const windowData = {
          id: window.id,
          name: window.name,
          status: "active",
        };
        socket.emit(WindowEvents.WINDOW_JOINED, { windowId });
        setSelectedWindow(windowData);
        localStorage.setItem("selectedWindow", JSON.stringify(windowData));
        await startHeartbeatInterval(windowData.id);
        setShowWindowModal(false);
        showToast(`Now managing ${window.name}`, "info");

        try {
          const currentQueueResponse = await currentServedQueue(windowData.id);
          const hasCurrentQueue =
            currentQueueResponse?.success && currentQueueResponse.queue;

          if (hasCurrentQueue) {
            setHasCurrentServedQueue(true);
            const restoredQueue = formatQueueData(currentQueueResponse.queue);
            setCurrentQueue(restoredQueue);
            console.log("✅ Restored current queue:", restoredQueue.queueNo);
          } else {
            setHasCurrentServedQueue(false);
            setCurrentQueue(getDefaultQueue());
            console.log("🎯 Window is empty - no current queue");
          }
        } catch (err) {
          console.error("⚠️ Failed to check current queue:", err);
          setCurrentQueue(getDefaultQueue());
        } finally {
          setIsLoading(false);
        }
      } else if (response?.status === 409) {
        showToast("Window already taken. Refreshing...", "error");
        await loadWindows();
      } else {
        showToast(response?.message || "Failed to assign window", "error");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error selecting window:", error);
      showToast("Error selecting window", "error");
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (
      !isLoading && // or your equivalent "queues finished loading" flag
      globalQueueList.length === 0 &&
      selectedWindow &&
      isDefaultQueue(currentQueue)
    ) {
      console.log("📭 No queues available - setting empty state");
      setWasQueueEmpty(true);
    }
  }, [isLoading, globalQueueList.length, selectedWindow, currentQueue]);
  useEffect(() => {
    if (
      globalQueueList.length > 0 &&
      selectedWindow &&
      isDefaultQueue(currentQueue) &&
      hasCurrentServedQueue === false &&
      !autoCallInProgressRef.current
    ) {
      console.log("🔄 Auto-calling next - conditions met:", {
        queueCount: globalQueueList.length,
        selectedWindow: !!selectedWindow,
        isDefaultQueue: isDefaultQueue(currentQueue),
        hasCurrentServedQueue,
        autoCallInProgress: autoCallInProgressRef.current,
      });
      // 🧩 Prevent multiple setTimeout calls immediately
      const performAutoCall = async () => {
        autoCallInProgressRef.current = true;
        setCallingNext(true);
        try {
          console.log("HELLLOOO??????????");
          await handleCallNext(selectedWindow);
          console.log("✅ Auto-call completed successfully");
          setHasCurrentServedQueue(true); // ensure it flips true on success
        } catch (error) {
          console.error("❌ Auto-call failed:", error);
          setWasQueueEmpty(true);
        } finally {
          autoCallInProgressRef.current = false;
          setCallingNext(false);
        }
      };

      const timeoutId = setTimeout(performAutoCall, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [
    globalQueueList.length,
    selectedWindow,
    hasCurrentServedQueue,
    handleCallNext,
    currentQueue,
  ]);

  const openActionPanel = (queue) => {
    setSelectedQueue(queue);
    setShowActionPanel(true);
  };

  const closeActionPanel = async () => {
    try {
      // Check if there's a selected queue and if it has at least one terminal request
      if (selectedQueue && selectedQueue.requests.length > 0) {
        const hasTerminalRequest = selectedQueue.requests.some(
          (req) => req.status === "Completed" || req.status === "Cancelled"
        );

        if (hasTerminalRequest) {
          // Trigger the done handler if at least one request is completed/cancelled
          await handleDonePanel();
          setHasChanges(false);
          return; // handleDonePanel will close the panel
        }
      }

      // Otherwise, just close normally
      setShowActionPanel(false);
      setSelectedQueue(null);
      setHasChanges(false);
    } catch (error) {
      console.warn(
        "Warning, there is an unprecedented error in closing the deferred modal!",
        error
      );
    }
  };

  const shouldDisableAnnounce = () => {
    const hasNoQueuesToServe = isDefaultQueue(currentQueue);
    const isCooldown = disabledForSeconds;
    return hasNoQueuesToServe || isCooldown;
  };

  const handleCloseWindowSelect = () => {
    setShowWindowModal(false);
    navigate("/staff/dashboard");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "text-green-600 bg-green-50";
      case "Stalled":
        return "text-gray-600 bg-gray-50";
      case "Skipped":
        return "text-orange-600 bg-orange-50";
      case "Cancelled":
        return "text-red-600 bg-red-50";
      case "In Progress":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const windowButtons = availableWindows.map((window) => ({
    text: window.name,
    onClick: () => handleWindowSelect(window.id),
    className:
      window.status === "inactive"
        ? "bg-transparent bg-[#202124] ring-1 cursor-not-allowed w-full"
        : "bg-[#1A73E8] text-white hover:bg-blue-700 w-full",
    disabled: window.status === "inactive",
  }));

  const rowVirtualizer = useVirtualizer({
    count: nextInLine.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // adjust if your rows are taller or shorter
    overscan: 5,
  });

  let scrollTimeout;
  const handleScroll = (e) => {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => (scrollTimeout = null), 300);

    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const nearBottom = scrollHeight - scrollTop - clientHeight < 100;
    if (nearBottom && hasMoreWaiting && !isLoading) {
      loadMoreWaitingQueues();
    }
  };

  // const filteredDeferredQueue = useMemo(() => {
  // if (statusFilter.length === 0) {
  //   return deferredQueue; // No filters = show all
  // }

  // return deferredQueue.filter(queue => {
  //   // Check if any request in this queue matches any selected status
  //   return queue.requests?.some(request =>
  //     statusFilter.some(filter =>
  //       request.status?.toLowerCase() === filter.toLowerCase()
  //     )
  //   );
  // });
  // }, [deferredQueue, statusFilter]);

  const deferredVirtualizer = useVirtualizer({
    count: deferredQueue.length,
    getScrollElement: () => deferredParentRef.current,
    estimateSize: () => 60, // Estimate row height
    overscan: 5,
  });

  const handleDeferredScroll = (e) => {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => (scrollTimeout = null), 300);

    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const nearBottom = scrollHeight - scrollTop - clientHeight < 100;
    if (nearBottom && hasMoreWaiting && !isLoading) {
      loadMoreDeferredQueues();
    }
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* Loading skeleton overlay */}
      {/* {isLoading && <LoadingSkeleton isLoading={isLoading} />} */}

      {/* Window Selection Modal (always above skeleton) */}
      {showWindowModal && (
        <DynamicModal
          isOpen={showWindowModal}
          onClose={handleCloseWindowSelect}
          title="Select a Window to Manage"
          description="Please choose which service window you would like to manage."
          iconAlt="Window Selection"
          buttons={windowButtons}
          buttonLayout="grid"
          modalWidth="w-1/3"
          modalHeight="h-auto"
          showCloseButton={true}
        />
      )}

      {isLoading ? (
        <LoadingSkeleton
          isLoading={isLoading}
          showHeader={true}
          showMainCard={true}
          showDeferredSections={true}
        />
      ) : (
        currentQueue && (
          <div className="min-h-screen bg-transparent w-full pr-7 pt-9 md:pl-15 xl:pl-9 xl:pt-12 xl:pr-8 pb-9">
            <div className="max-w-full mx-auto">
              <h1 className="text-3xl font-semibold text-left text-gray-900 mb-9 mt-6">
                Manage Queue
              </h1>
              {/* Current Queue Display - Updated */}
              {callingNext && !isLoading ? (
                <MainCardSkeleton />
              ) : (
                <div className="bg-white rounded-xl shadow-xs mb-4 overflow-hidden">
                  <div className="p-4 bg- md:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-[#F5F5F5] p-2 rounded-xl">
                        <img src="/assets/Monitor.png" alt="" />
                      </div>
                      <span className="font-semibold text-gray-700">
                        {selectedWindow?.name || "Window 0"}
                      </span>
                    </div>

                    {/* container */}
                    <div className="flex lg:flex-row flex-col  items-center justify-between gap-6 h-full">
                      {/* left side */}
                      <div className="border w-full md:flex-1 flex flex-col border-[#E2E3E4] rounded-lg p-6 xl:px-8 md:p-6 h-full">
                        <div className=" text-left mb-4 ">
                          <div
                            className={`text-7xl text-center ring-1 rounded-xl py-4 px-1 font-bold mb-2 text-[#1A73E8] ${
                              currentQueue.type === "Priority"
                                ? "text-[#F9AB00] border-[#F9AB00]"
                                : "text-[#1A73E8] border-[#1A73E8]"
                            }`}
                          >
                            {currentQueue.queueNo}
                          </div>
                          <span
                            className={`"font-medium text-sm px-3 py-1 rounded-full ${
                              currentQueue.type === "Priority"
                                ? "bg-[#FEF2D9] text-[#F9AB00]"
                                : "bg-[#DDEAFC] text-[#1A73E8]"
                            }`}
                          >
                            {currentQueue.type}
                          </span>
                        </div>

                        <div className="space-y-3 text-sm text-left">
                          <div>
                            <div className="text-[#686969] mb-1">Name</div>
                            <div className="font-semibold text-[#202124]">
                              {currentQueue.name}
                            </div>
                          </div>
                          <div>
                            <div className="text-[#686969] mb-1">
                              Student ID
                            </div>
                            <div className="font-semibold text-[#202124]">
                              {currentQueue.studentId}
                            </div>
                          </div>
                          <div>
                            <div className="text-[#686969] mb-1">
                              Course & Year
                            </div>
                            <div className="font-semibold text-[#202124]">
                              {currentQueue.course}
                            </div>
                          </div>
                          <div>
                            <div className="text-[#686969] mb-1">Time</div>
                            <div className="font-semibold text-[#202124]">
                              {currentQueue.time}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* right side */}
                      <div className="w-full flex flex-col flex-5 justify-between">
                        <div className="flex-1">
                          <div className="space-y-3">
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                              {/* Scrollable wrapper for table body */}
                              <div className="h-75 overflow-y-auto custom-scrollbar">
                                <table className="w-full">
                                  <thead className="bg-white sticky top-0 z-10">
                                    {/* Service Requests Header Row */}
                                    <tr className="border-b border-gray-200">
                                      <th
                                        colSpan="3"
                                        className="text-left py-5 px-4 text-xl font-medium  text-gray-900 "
                                      >
                                        Service Requests
                                      </th>
                                    </tr>
                                    {/* Table Headers */}
                                    <tr className="border-b border-gray-200">
                                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969] w-44">
                                        Request
                                      </th>
                                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969] w-36">
                                        Status
                                      </th>
                                      <th className="text-center py-3 px-4 text-sm font-semibold text-[#686969] w-16">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {currentQueue.requests.map((request) => (
                                      <tr
                                        key={request.id}
                                        className="border-b border-gray-200 hover:bg-gray-50 transition"
                                      >
                                        <td className="text-left py-3 px-4 text-sm font-medium text-[#202124]">
                                          {request.name}
                                        </td>
                                        <td className="text-left py-3 px-4">
                                          <div
                                            className={`text-xs font-medium  py-1 rounded w-24 text-left text-[#202124] `}
                                          >
                                            {request.status}
                                          </div>
                                        </td>
                                        <td className="text-center py-3 px-4">
                                          <div className="flex gap-2 items-center justify-center">
                                            {/* Done Button with Top Tooltip */}
                                            <div className="relative group">
                                              <button
                                                onClick={() =>
                                                  handleRequestAction(
                                                    request.id,
                                                    "done"
                                                  )
                                                }
                                                className="w-8 h-8 flex items-center justify-center bg-[#26BA33]/20 text-green-600 rounded-lg hover:bg-green-200 transition-colors cursor-pointer"
                                              >
                                                <Check className="w-4 h-4" />
                                              </button>
                                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                                                Done
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                              </div>
                                            </div>

                                            {/* Stall Button with Top Tooltip */}
                                            <div className="relative group">
                                              <button
                                                onClick={() =>
                                                  handleRequestAction(
                                                    request.id,
                                                    "stall"
                                                  )
                                                }
                                                className="w-8 h-8 flex items-center justify-center bg-[#686969]/20 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                                              >
                                                <img
                                                  src="/assets/manage_queue/pause.png"
                                                  alt="Edit"
                                                />
                                              </button>
                                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                                                Stall
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                              </div>
                                            </div>

                                            {/* Skip Button with Top Tooltip */}
                                            <div className="relative group">
                                              <button
                                                onClick={() =>
                                                  handleRequestAction(
                                                    request.id,
                                                    "skip"
                                                  )
                                                }
                                                className="w-8 h-8 flex items-center justify-center bg-[#ED9314]/20 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors cursor-pointer"
                                              >
                                                <img
                                                  src="/assets/manage_queue/forward.png"
                                                  alt="Edit"
                                                />
                                              </button>
                                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                                                Skip
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                              </div>
                                            </div>

                                            {/* Cancel Button with Top Tooltip */}
                                            <div className="relative group">
                                              <button
                                                onClick={() =>
                                                  handleRequestAction(
                                                    request.id,
                                                    "cancel"
                                                  )
                                                }
                                                className="w-8 h-8 flex items-center justify-center bg-[#EA4335]/20 text-red-600 rounded-lg hover:bg-red-200 transition-colors cursor-pointer"
                                              >
                                                <X className="w-4 h-4" />
                                              </button>
                                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                                                Cancel
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 mt-8 md:mt-14 justify-end">
                          <button
                            onClick={() =>
                              handleButtonClick(
                                handleCallNext,
                                disabledForSeconds,
                                lastAnnounceTime,
                                setDisabledForSeconds,
                                setLastAnnounceTime
                              )
                            }
                            disabled={
                              disabledForSeconds ||
                              currentQueue.requests.some(
                                (request) => request.status === "In Progress"
                              )
                            }
                            className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-4 rounded-2xl transition-colors w-full sm:w-auto ${
                              disabledForSeconds ||
                              currentQueue.requests.some(
                                (request) => request.status === "In Progress"
                              )
                                ? "bg-[#1A73E8]/50 text-gray-200 cursor-not-allowed"
                                : "bg-[#1A73E8] text-white hover:bg-blue-600 cursor-pointer"
                            }`}
                          >
                            <img
                              src="/assets/manage_queue/Announcement-1.png"
                              alt="Edit"
                              className="w-5 h-5 sm:w-6 sm:h-6"
                            />
                            <span className="text-sm sm:text-base">
                              Call Next
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              handleButtonClick(
                                () =>
                                  AnnounceQueue(
                                    currentQueue.queueNo,
                                    selectedWindow?.name
                                  ),
                                disabledForSeconds,
                                lastAnnounceTime,
                                setDisabledForSeconds,
                                setLastAnnounceTime
                              )
                            }
                            disabled={shouldDisableAnnounce()}
                            className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-4 rounded-2xl transition-colors w-full sm:w-auto ${
                              shouldDisableAnnounce()
                                ? "bg-[#FACC15]/50 cursor-not-allowed text-gray-200"
                                : "bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer"
                            }`}
                          >
                            <img
                              src="/assets/manage_queue/Announcement.png"
                              alt="Announce"
                              className="w-5 h-5 sm:w-6 sm:h-6"
                            />
                            <span className="text-sm sm:text-base">
                              Announce
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-xs mb-4 overflow-hidden">
                <button
                  onClick={() => setDeferredOpen(!deferredOpen)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">
                      Deferred
                    </span>
                    <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full min-w-[24px] text-center">
                      {deferredQueue.length}
                    </span>
                  </div>
                  {deferredOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {deferredOpen && (
                  <div className="p-4">
                    {/* Search bar and filter buttons */}
                    <div className="mb-4 flex justify-end items-center gap-4">
                      <div className="relative flex-1 max-w-sm">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Search by name, ID"
                          value={deferredSearchTerm}
                          onChange={(e) =>
                            setDeferredSearchTerm(e.target.value)
                          }
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex rounded-2xl bg-[#F4F8FE] px-3 py-2 gap-2">
                        {["stalled", "skipped"].map((status) => (
                          <button
                            key={status}
                            onClick={() => toggleStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                              statusFilter.includes(status)
                                ? "bg-gray-900 text-white"
                                : " text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Virtualized Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden relative">
                      <div
                        ref={deferredParentRef}
                        onScroll={handleDeferredScroll}
                        className="overflow-y-auto custom-scrollbar max-h-96"
                      >
                        <table className="text-sm  w-full text-gray-900 table-fixed">
                          <thead className="sticky top-0 bg-white z-10">
                            <tr className="border-b  border-[#E2E3E4]">
                              <th
                                className="text-left py-3 px-4 font-semibold text-[#686969]"
                                style={{ width: "150px" }}
                              >
                                Student ID
                              </th>
                              <th
                                className="text-left py-3 px-4 font-semibold text-[#686969]"
                                style={{ width: "200px" }}
                              >
                                Name
                              </th>
                              <th
                                className="text-left py-3 px-4 font-semibold text-[#686969]"
                                style={{ width: "250px" }}
                              >
                                Request
                              </th>
                              <th
                                className="text-left py-3 px-4 font-semibold text-[#686969]"
                                style={{ width: "120px" }}
                              >
                                Status
                              </th>
                              <th
                                className="text-left py-3 px-4 font-semibold text-[#686969]"
                                style={{ width: "120px" }}
                              >
                                Action
                              </th>
                            </tr>
                          </thead>

                          <tbody
                            style={{
                              height: `${deferredVirtualizer.getTotalSize()}px`,
                              position: "relative",
                            }}
                          >
                            {deferredVirtualizer
                              .getVirtualItems()
                              .map((virtualRow) => {
                                const item = deferredQueue[virtualRow.index];
                                if (!item) return null;

                                return (
                                  <tr
                                    key={item.queueId || virtualRow.index}
                                    className="border-b border-[#E2E3E4] hover:bg-gray-50 transition"
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      transform: `translateY(${virtualRow.start}px)`,
                                      width: "100%",
                                      display: "table",
                                      tableLayout: "fixed",
                                    }}
                                  >
                                    <td
                                      className="text-left py-3 px-4"
                                      style={{ width: "150px" }}
                                    >
                                      {item.studentId}
                                    </td>

                                    <td
                                      className="text-left py-3 px-4"
                                      style={{ width: "200px" }}
                                    >
                                      <span
                                        className="truncate block"
                                        title={item.name}
                                      >
                                        {item.name}
                                      </span>
                                    </td>

                                    <td
                                      className="text-left py-3 px-4"
                                      style={{ width: "250px" }}
                                    >
                                      <div className="relative">
                                        {item.requests &&
                                        item.requests.length > 0 ? (
                                          <div className="flex items-center">
                                            <span
                                              className="truncate block max-w-[180px]"
                                              title={item.requests[0].name}
                                            >
                                              {item.requests[0].name}
                                            </span>
                                            {item.requests.length > 1 && (
                                              <>
                                                <span
                                                  className="ml-2 border border-[#1A73E8] text-[#1A73E8] font-semibold text-xs px-2 py-0.5 rounded-full cursor-pointer flex-shrink-0"
                                                  onMouseEnter={(e) => {
                                                    const rect =
                                                      e.currentTarget.getBoundingClientRect();
                                                    setTooltipData({
                                                      id: `deferred-${virtualRow.index}`,
                                                      requests:
                                                        item.requests.slice(1),
                                                      position: {
                                                        top: rect.top - 10,
                                                        left: rect.left,
                                                      },
                                                    });
                                                  }}
                                                  onMouseLeave={() => {
                                                    setHoveredRow(null);
                                                    setTooltipData(null);
                                                  }}
                                                >
                                                  +{item.requests.length - 1}
                                                </span>
                                                {hoveredRow ===
                                                  `deferred-${virtualRow.index}` && (
                                                  <div className="absolute   bottom-full left-0 mb-2 border border-[#E2E3E4] bg-white p-3 rounded-lg shadow-lg z-20 min-w-[200px] max-w-[300px]">
                                                    {item.requests
                                                      .slice(1)
                                                      .map((req) => (
                                                        <div
                                                          key={req.id}
                                                          className="py-1 text-xs break-words"
                                                        >
                                                          {req.name}
                                                        </div>
                                                      ))}
                                                  </div>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-gray-400 italic">
                                            All requests processed
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    <td
                                      className="text-left py-3 px-4"
                                      style={{ width: "120px" }}
                                    >
                                      <span
                                        className={`text-${
                                          getMajorityStatus(item.requests) ===
                                          "Stalled"
                                            ? "gray-600"
                                            : "[#F9AB00]"
                                        }`}
                                      >
                                        {getMajorityStatus(item.requests)}
                                      </span>
                                    </td>

                                    <td
                                      className="text-left py-3 px-4"
                                      style={{ width: "120px" }}
                                    >
                                      <button
                                        onClick={() => openActionPanel(item)}
                                        className="px-4 py-1.5 bg-[#1A73E8] text-white font-medium text-sm rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                                      >
                                        View
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}

                            {isLoading && hasMoreDeferred && (
                              <tr
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  transform: `translateY(${deferredVirtualizer.getTotalSize()}px)`,
                                  width: "100%",
                                  display: "table",
                                  tableLayout: "fixed",
                                }}
                              >
                                <td
                                  colSpan="5"
                                  className="py-4 text-center text-gray-500 animate-pulse"
                                >
                                  Loading more queues...
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {/* Render tooltip outside the table */}
                      {tooltipData && (
                        <div
                          className="fixed border space-y-2 border-[#E2E3E4] bg-white p-3 rounded-lg shadow-lg z-[9999] min-w-[200px] max-w-[300px]"
                          style={{
                            top: `${tooltipData.position.top}px`,
                            left: `${tooltipData.position.left}px`,
                            transform: "translateY(-100%)",
                          }}
                        >
                          {tooltipData.requests.map((req) => (
                            <div
                              key={req.id}
                              className="text-xs text-left break-words"
                            >
                              {req.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Empty state */}
                    {deferredQueue.length === 0 && !isLoading && (
                      <div className="py-8 text-center text-gray-500">
                        {isDeferredSearchMode
                          ? "No results found"
                          : "No deferred queues"}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-xs overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setNextInLineOpen(!nextInLineOpen)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">
                      Next in Line
                    </span>
                    <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full min-w-[24px] text-center">
                      {totalWaitingCount || 0}
                    </span>
                  </div>
                  {nextInLineOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {/* Content */}
                {nextInLineOpen && (
                  <div className="p-4">
                    {/* Search Bar */}
                    <div className="mb-4 text-right">
                      <div className="relative inline-block max-w-md w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Search by queue number, name, ID"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    {/* Optional: show "Clear search" only
                    {isWaitingSearchMode && (
                      <div className="mb-2 text-right">
                        <button
                          onClick={() => setSearchTerm("")}
                          className="text-blue-600 text-sm hover:underline"
                        >
                          Clear search
                        </button>
                      </div>
                    )} */}
                    {/* Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div
                        ref={parentRef}
                        onScroll={handleScroll}
                        className="w-full overflow-y-auto custom-scrollbar max-h-96 "
                      >
                        <table className="text-sm w-full text-gray-900 table-fixed">
                          <thead className="sticky top-0 bg-white z-10">
                            <tr className="border-b border-[#E2E3E4]">
                              <th
                                className="text-left py-3 px-4 font-semibold text-[#686969]"
                                style={{ width: "150px" }}
                              >
                                Queue No.
                              </th>
                              <th
                                className="text-left py-3 px-4 font-semibold text-[#686969]"
                                style={{ width: "200px" }}
                              >
                                Student ID
                              </th>
                              <th
                                className="text-left py-3 px-4 font-semibold text-[#686969]"
                                style={{ width: "200px" }}
                              >
                                Name
                              </th>
                              <th
                                className="text-left py-3 px-4 font-semibold text-[#686969]"
                                style={{ width: "200px" }}
                              >
                                Request
                              </th>
                              <th
                                className="text-left py-3 px-4 font-semibold text-[#686969]"
                                style={{ width: "120px" }}
                              >
                                Time
                              </th>
                            </tr>
                          </thead>

                          <tbody
                            style={{
                              height: `${rowVirtualizer.getTotalSize()}px`,
                              position: "relative",
                            }}
                          >
                            {rowVirtualizer
                              .getVirtualItems()
                              .map((virtualRow) => {
                                const item = globalQueueList[virtualRow.index];
                                if (!item) return null;

                                return (
                                  <tr
                                    key={item.queueId || virtualRow.index}
                                    className="border-b  border-[#E2E3E4] hover:bg-gray-50 transition"
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      transform: `translateY(${virtualRow.start}px)`,
                                      width: "100%",
                                      display: "table",
                                      tableLayout: "fixed",
                                    }}
                                  >
                                    <td
                                      className="text-left py-4 px-4 font-semibold"
                                      style={{ width: "150px" }}
                                    >
                                      <span
                                        className={
                                          item.type === "Priority"
                                            ? "text-[#F9AB00]"
                                            : "text-[#1A73E8]"
                                        }
                                      >
                                        {item.queueNo}
                                      </span>
                                    </td>

                                    <td
                                      className="text-left py-4 px-4"
                                      style={{ width: "200px" }}
                                    >
                                      {item.studentId}
                                    </td>

                                    <td
                                      className="text-left py-4 px-4"
                                      style={{ width: "200px" }}
                                    >
                                      <span
                                        className="truncate block"
                                        title={item.name}
                                      >
                                        {item.name}
                                      </span>
                                    </td>

                                    <td
                                      className="text-left py-4 px-4"
                                      style={{ width: "200px" }}
                                    >
                                      {item.requests &&
                                      item.requests.length > 0 ? (
                                        <div className="relative flex items-center">
                                          <span
                                            className="truncate block max-w-[180px]"
                                            title={item.requests[0].name}
                                          >
                                            {item.requests[0].name}
                                          </span>
                                          {item.requests.length > 1 && (
                                            <>
                                              <span
                                                className="ml-2 border border-[#1A73E8] text-[#1A73E8] font-semibold text-xs px-2 py-0.5 rounded-full cursor-pointer flex-shrink-0"
                                                onMouseEnter={(e) => {
                                                  const rect =
                                                    e.currentTarget.getBoundingClientRect();
                                                  setTooltipData({
                                                    id: `deferred-${virtualRow.index}`,
                                                    requests:
                                                      item.requests.slice(1),
                                                    position: {
                                                      top: rect.top - 10,
                                                      left: rect.left,
                                                    },
                                                  });
                                                }}
                                                onMouseLeave={() => {
                                                  setHoveredRow(null);
                                                  setTooltipData(null);
                                                }}
                                              >
                                                +{item.requests.length - 1}
                                              </span>
                                              {hoveredRow ===
                                                virtualRow.index && (
                                                <div className="absolute bottom-full left-0 mb-2 bg-white border border-[#E2E3E4] p-3 rounded-lg shadow-lg z-40 min-w-[200px] max-w-[300px]">
                                                  {item.requests
                                                    .slice(1)
                                                    .map((req) => (
                                                      <div
                                                        key={req.id}
                                                        className="py-1 text-xs break-words"
                                                      >
                                                        {req.name}
                                                      </div>
                                                    ))}
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400">
                                          No requests
                                        </span>
                                      )}
                                    </td>

                                    <td
                                      className="py-4 px-4 text-left"
                                      style={{ width: "120px" }}
                                    >
                                      {item.time}
                                    </td>
                                  </tr>
                                );
                              })}

                            {nextInLineLoading && (
                              <tr
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  transform: `translateY(${rowVirtualizer.getTotalSize()}px)`,
                                  width: "100%",
                                }}
                              >
                                <td
                                  colSpan="5"
                                  className="py-4 text-center text-gray-500 animate-pulse flex justify-center items-center"
                                >
                                  Loading more queues...
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {tooltipData && (
                        <div
                          className="fixed border space-y-2 border-[#E2E3E4] bg-white p-3 rounded-lg shadow-lg z-[9999] min-w-[200px] max-w-[300px]"
                          style={{
                            top: `${tooltipData.position.top}px`,
                            left: `${tooltipData.position.left}px`,
                            transform: "translateY(-100%)",
                          }}
                        >
                          {tooltipData.requests.map((req) => (
                            <div
                              key={req.id}
                              className="text-xs text-left break-words"
                            >
                              {req.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Empty State */}
                    {globalQueueList.length === 0 && !isLoading && (
                      <div className="py-8 text-center text-gray-500">
                        {isWaitingSearchMode
                          ? "No results found"
                          : "No queues available"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* modal for view button */}
            {showActionPanel && selectedQueue && (
              <div className="fixed inset-0 bg-black/20 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between p-6  border-gray-200 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Action Panel
                    </h2>
                    <button
                      onClick={closeActionPanel}
                      className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="px-6 md:pb-6 pb-4 pt-2 xl:pt-0">
                    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
                      {/* left side */}
                      <div className="w-full lg:w-auto border-1 flex-1 border-[#E2E3E4] rounded-lg p-6 h-full">
                        <div className="text-left mb-4">
                          <div
                            className={`text-5xl text-center border border-[#1A73E8] rounded-xl py-3 font-bold mb-2 ${
                              selectedQueue.type === "Priority"
                                ? "text-[#F9AB00] border-[#F9AB00]"
                                : "text-[#1A73E8] border-[#1A73E8]"
                            }`}
                          >
                            {selectedQueue.queueNo}
                          </div>
                          <span
                            className={`text-sm px-3 py-1 rounded-full ${
                              selectedQueue.type === "Priority"
                                ? "bg-[#FEF2D9] text-[#F9AB00]"
                                : "bg-[#DDEAFC] text-[#1A73E8]"
                            }`}
                          >
                            {selectedQueue.type}
                          </span>
                        </div>

                        <div className="space-y-3 text-sm text-left">
                          <div>
                            <div className="text-gray-500 mb-1">Name</div>
                            <div className="font-semibold text-gray-900">
                              {selectedQueue.name}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">Student ID</div>
                            <div className="font-semibold text-gray-900">
                              {selectedQueue.studentId}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">
                              Course & Year
                            </div>
                            <div className="font-semibold text-gray-900">
                              {selectedQueue.course}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">Time</div>
                            <div className="font-semibold text-gray-900">
                              {selectedQueue.time}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* right side */}
                      <div className="w-full flex flex-col  flex-4 justify-between ">
                        <div className="flex-1">
                          <div className="space-y-3">
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                              {/* Scrollable wrapper for table body */}
                              <div className="h-75 overflow-y-auto custom-scrollbar">
                                <table className="w-full">
                                  <thead className="bg-white sticky top-0 z-10">
                                    {/* Service Requests Header Row */}
                                    <tr className="border-b border-gray-200">
                                      <th
                                        colSpan="3"
                                        className="text-left py-5 px-4 text-xl font-medium text-gray-900"
                                      >
                                        Service Requests
                                      </th>
                                    </tr>
                                    {/* Table Headers */}
                                    <tr className="border-b border-gray-200">
                                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-44">
                                        Request
                                      </th>
                                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-36">
                                        Status
                                      </th>
                                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 w-16">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {selectedQueue.requests.map((request) => (
                                      <tr
                                        key={request.id}
                                        className="border-b border-gray-200 hover:bg-gray-50 transition"
                                      >
                                        <td className="text-left py-3 px-4 text-sm font-medium text-gray-900">
                                          {request.name}
                                        </td>
                                        <td className="text-left py-3 px-4">
                                          <div
                                            className={`text-xs font-medium py-1 rounded w-24 text-left text-[#202124]`}
                                          >
                                            {request.status}
                                          </div>
                                        </td>
                                        <td className="text-center py-3 px-4">
                                          <div className="flex gap-2 items-center justify-center">
                                            {/* Done Button with Top Tooltip */}
                                            <div className="relative group">
                                              <button
                                                onClick={() =>
                                                  handleDeferredAction(
                                                    request.id,
                                                    "done"
                                                  )
                                                }
                                                className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors cursor-pointer"
                                              >
                                                <Check className="w-4 h-4" />
                                              </button>
                                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                                                Done
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                              </div>
                                            </div>

                                            {/* Stall Button with Top Tooltip */}
                                            <div className="relative group">
                                              <button
                                                onClick={() =>
                                                  handleDeferredAction(
                                                    request.id,
                                                    "stall"
                                                  )
                                                }
                                                className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                                              >
                                                <img
                                                  src="/assets/manage_queue/pause.png"
                                                  alt="Edit"
                                                />
                                              </button>
                                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                                                Stall
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                              </div>
                                            </div>

                                            {/* Skip Button with Top Tooltip */}
                                            <div className="relative group">
                                              <button
                                                onClick={() =>
                                                  handleDeferredAction(
                                                    request.id,
                                                    "skip"
                                                  )
                                                }
                                                className="w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 rounded hover:bg-orange-200 transition-colors cursor-pointer"
                                              >
                                                <img
                                                  src="/assets/manage_queue/forward.png"
                                                  alt="Edit"
                                                />
                                              </button>
                                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                                                Skip
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                              </div>
                                            </div>

                                            {/* Cancel Button with Top Tooltip */}
                                            <div className="relative group">
                                              <button
                                                onClick={() =>
                                                  handleDeferredAction(
                                                    request.id,
                                                    "cancel"
                                                  )
                                                }
                                                className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors cursor-pointer"
                                              >
                                                <X className="w-4 h-4" />
                                              </button>
                                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                                                Cancel
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-4 mt-6 md:mt-12 justify-end">
                          <button
                            onClick={handleDonePanel}
                            disabled={!hasChanges}
                            className={`flex items-center justify-center text-md gap-2 px-3 py-3 sm:px-4 sm:py-4 w-full md:w-auto rounded-xl transition-colors ${
                              hasChanges
                                ? "bg-[#1A73E8] text-white hover:bg-blue-600 cursor-pointer"
                                : "bg-[#1A73E8]/50 text-gray-200 cursor-not-allowed"
                            }`}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      )}
      {/* {currentQueue && (

      )} */}
    </div>
  );
}
