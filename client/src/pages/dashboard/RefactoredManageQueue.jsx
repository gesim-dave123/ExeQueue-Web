import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Pause,
  SkipForward,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  assignServiceWindow,
  checkAvailableWindow,
  getMyWindowAssignment,
  getWindowData,
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
import ManageQueueHook from "./ManageQueue/ManageQueueHook.jsx";

export default function Manage_Queue() {
  const navigate = useNavigate();
  const parentRef = useRef(null);
  const autoCallInProgressRef = useRef(false);
  const [deferredOpen, setDeferredOpen] = useState(true);
  const [nextInLineOpen, setNextInLineOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deferredSearchTerm, setDeferredSearchTerm] = useState("");
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [hasCurrentServedQueue, setHasCurrentServedQueue] = useState(false);
  // const [selectedQueue, setSelectedQueue] = useState(null); // ✅ Now from hook
  const [hoveredRow, setHoveredRow] = useState(null);

  const [showWindowModal, setShowWindowModal] = useState(false);
  const [selectedWindow, setSelectedWindow] = useState({});
  const [availableWindows, setAvailableWindows] = useState([]);
  const [callingNext, setCallingNext] = useState(false);
  const { socket, isConnected } = useSocket();
  const [wasQueueEmpty, setWasQueueEmpty] = useState(false);

  const DEFAULT_QUEUE = {
    queueNo: "R000",
    studentId: "N/A",
    name: "John Doe",
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
      console.error("❌ Error loading windows:", error);
      showToast("Failed to load windows", "error");
      setIsLoading(false);
    }
  };
  const {
    globalQueueList, // ✅ Drop-in replacement
    deferredQueue, // ✅ Drop-in replacement
    currentQueue, // ✅ Drop-in replacement
    selectedQueue, // ✅ Drop-in replacement
    isLoading, // ✅ Drop-in replacement
    setIsLoading,
    nextInLineLoading,
    setNextInlineLoading,

    // New: Total counts
    totalWaitingCount, // NEW: Total in DB (e.g., 3000)
    totalDeferredCount, // NEW: Total deferred

    // New: Pagination
    hasMoreWaiting, // NEW: Can load more waiting queues
    hasMoreDeferred, // NEW: Can load more deferred queues

    // Actions
    setCurrentQueue, // ✅ Same as before
    setSelectedQueue, // ✅ Same as before
    loadMoreWaitingQueues, // NEW: Load next batch
    loadMoreDeferredQueues, // NEW: Load next batch
    fetchQueueList, // ✅ Same as before (for manual refresh)
  } = ManageQueueHook({
    socket,
    isConnected,
    // selectedWindow,
    showWindowModal,
    setShowWindowModal,
    sortByPriorityPattern,
    loadWindows, // Your existing function
    showToast, // Your existing function
    // formatTime, // Your existing function
    setSelectedWindow,
    selectedWindow,
    Status, // Your Status enum
    QueueActions, // Your QueueActions enum
    SocketEvents, // Your SocketEvents enum
    WindowEvents, // Your WindowEvents enum
  });

  const isDefaultQueue = (queue) => {
    return queue && queue.queueNo === "R000" && queue.studentId === "N/A";
  };
  const nextInLine = (globalQueueList || []).slice(0);
  const filteredNextInLine = (nextInLine || []).filter((item) => {
    const search = searchTerm?.toLowerCase() || "";
    return (
      (item.queueNo?.toLowerCase() || "").includes(search) ||
      (item.name?.toLowerCase() || "").includes(search) ||
      (item.studentId?.toLowerCase() || "").includes(search)
    );
  });
  const filteredDeferredQueue = deferredQueue.filter((item) => {
    const search = deferredSearchTerm?.toLowerCase() || "";
    return (
      (item.queueNo?.toLowerCase() || "").includes(search) ||
      (item.name?.toLowerCase() || "").includes(search) ||
      (item.studentId?.toLowerCase() || "").includes(search)
    );
  });
  const handleCallNext = async (overrideWindow) => {
    const activeWindow = overrideWindow || selectedWindow;
    setCallingNext(true);
    try {
      if (!activeWindow?.id) {
        showToast("Please select a window first.", "error");
        return;
      }

      if (currentQueue?.queueId) {
        console.log(
          `🔖 Marking previous queue ${currentQueue.queueNo} before calling next...`
        );

        try {
          const markResponse = await markQueueStatus(
            currentQueue.queueId,
            currentQueue.windowId
          );

          if (!markResponse.success) {
            console.error(
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
          console.error(
            "❌ BLOCKING: Error marking previous queue:",
            markError
          );
          showToast(
            "Cannot proceed: Error updating queue status. Please try again.",
            "error"
          );
          return;
        }
      }

      const response = await getCallNextQueue(activeWindow.id);
      console.log("Call Next Response:", response);

      if (response.status === 404 || !response.success) {
        if (response?.message?.includes("No queues left")) {
          showToast("🎉 No more queues left for today!", "info");
          setCurrentQueue(getDefaultQueue());
          setWasQueueEmpty(true);
          return;
        }

        showToast(response?.message || "Failed to call next queue.", "error");
        return;
      }

      const assignedQueue = response.data;
      const formattedQueue = formatQueueData(assignedQueue);
      // setHasCurrentServedQueue(true);

      setCurrentQueue(formattedQueue);
      console.log("Current Queue:", formattedQueue);

      // ✅ The hook automatically removes from globalQueueList via socket
      // But we can also do it locally for instant feedback
      // setGlobalQueueList is handled by the hook

      socket.emit(QueueActions.QUEUE_TAKEN, {
        queueId: assignedQueue.queueId,
        queueNo: assignedQueue.queueNo,
        windowId: activeWindow.id,
      });

      console.log("Formatted Queue:", formattedQueue.queueNo);
      AnnounceQueue(formattedQueue.queueNo, activeWindow.name);
      showToast(`Now serving ${formattedQueue.queueNo}`, "success");
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

      showToast(`Request ${requestStatus.toLowerCase()}`, "success");
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

      showToast(`Request updated to ${requestStatus}`, "success");
    } catch (error) {
      console.error("❌ Error updating deferred request:", error);
      setSelectedQueue(snapshot.selectedQueue);
      showToast(error.message || "Error updating deferred request", "error");
    }
  };

  const handleDonePanel = async () => {
    if (!selectedQueue) {
      closeActionPanel();
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
          `Queue ${selectedQueue.queueNo} has been finalized and removed.`,
          "success"
        );
      } else {
        showToast(
          `Queue ${selectedQueue.queueNo} cannot be finalized - has unresolved requests.`,
          "warning"
        );
      }
    } catch (error) {
      console.error("Error finalizing queue status:", error);
      setSelectedQueue(snapshot.selectedQueue);
      showToast(error.message || "Error finalizing queue status", "error");
    } finally {
      closeActionPanel();
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
        showToast("This window is currently occupied/inactive", "error");
        return;
      }

      const response = await assignServiceWindow(windowId);
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

        setShowWindowModal(false);
        showToast(`Now managing ${window.name}`, "success");

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

  const closeActionPanel = () => {
    setShowActionPanel(false);
    setSelectedQueue(null);
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
          <div className="min-h-screen bg-transparent w-full p-4 md:p-10">
            <div className="max-w-full mx-auto">
              <h1 className="text-2xl md:text-3xl font-semibold text-left text-gray-900 mb-9 mt-6">
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
                    <div className="flex  items-center justify-between gap-6 h-full">
                      {/* left side */}
                      <div className="border-2 flex-1  border-[#E2E3E4] rounded-lg p-6 h-full">
                        <div className=" text-left mb-4 ">
                          <div
                            className={`text-7xl text-center ring-1 rounded-xl py-4 font-bold mb-2 text-[#1A73E8] ${
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
                      <div className="flex flex-col flex-5 justify-between">
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

                        <div className="flex gap-3 mt-15 justify-end">
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
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
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
                            />
                            Call Next
                          </button>
                          <button
                            onClick={() =>
                              handleButtonClick(
                                () =>
                                  AnnounceQueue(
                                    currentQueue.queueNo,
                                    selectedWindow?.name
                                  ), //Announce the current queue
                                disabledForSeconds,
                                lastAnnounceTime,
                                setDisabledForSeconds,
                                setLastAnnounceTime
                              )
                            }
                            disabled={shouldDisableAnnounce()}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                              shouldDisableAnnounce()
                                ? "bg-[#FACC15]/50 cursor-not-allowed text-gray-200"
                                : "bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer"
                            }`}
                          >
                            <img
                              src="/assets/manage_queue/Announcement.png"
                              alt="Announce"
                            />
                            Announce
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
                  <div className="p-4 bg-">
                    <div className="mb-4 text-right">
                      <div className="relative inline-block max-w-md w-full">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
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
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Table Container */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Fixed Header */}
                      <div className="overflow-y-scroll custom-scrollbar max-h-96">
                        <table className="w-full min-w-[700px]">
                          <thead className="bg-white sticky top-0 z-10">
                            <tr className="border-b border-[#E2E3E4]">
                              <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969] w-40">
                                Student ID
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969] w-48">
                                Name
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969] w-64">
                                Request
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969] w-32">
                                Action
                              </th>
                            </tr>
                          </thead>

                          {/* Scrollable Body */}
                          <tbody>
                            {filteredDeferredQueue.length > 0 ? (
                              filteredDeferredQueue.map((item, index) => (
                                <tr
                                  key={index}
                                  className="border-b border-[#E2E3E4] hover:bg-gray-50"
                                >
                                  <td className="text-left py-3 px-4 text-sm text-[#202124] w-40">
                                    {item.studentId}
                                  </td>
                                  <td className="text-left py-3 px-4 text-sm text-[#202124] w-48">
                                    {item.name}
                                  </td>
                                  <td className="text-left py-3 px-4 text-sm text-[#202124] w-64">
                                    <div className="relative">
                                      {/* ✅ Add safety check for empty requests array */}
                                      {item.requests &&
                                      item.requests.length > 0 ? (
                                        <>
                                          {item.requests[0].name}
                                          {item.requests.length > 1 && (
                                            <>
                                              <span
                                                className="ml-2 bg-transparent font-semibold border-1 border-[#1A73E8] text-[#1A73E8] text-xs px-2 py-0.5 rounded-full cursor-pointer"
                                                onMouseEnter={() =>
                                                  setHoveredRow(
                                                    `deferred-${index}`
                                                  )
                                                }
                                                onMouseLeave={() =>
                                                  setHoveredRow(null)
                                                }
                                              >
                                                +{item.requests.length - 1}
                                              </span>
                                              {hoveredRow ===
                                                `deferred-${index}` && (
                                                <div className="absolute bottom-full left-0 mb-2 border border-[#E2E3E4] bg-white text-black p-3 rounded-lg shadow-lg z-50 min-w-[200px]">
                                                  {item.requests
                                                    .slice(1)
                                                    .map((req, idx) => (
                                                      <div
                                                        key={idx}
                                                        className="py-1 text-xs"
                                                      >
                                                        {req.name}
                                                      </div>
                                                    ))}
                                                  <div className="absolute top-full left-38 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent"></div>
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </>
                                      ) : (
                                        <span className="text-gray-400 italic">
                                          All requests processed
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="text-left py-3 px-4">
                                    <button
                                      onClick={() => openActionPanel(item)}
                                      className="px-4 py-1.5 bg-[#1A73E8] text-white font-medium text-sm rounded-xl hover:bg-blue-600 transition-colors cursor-pointer"
                                    >
                                      View
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan="4"
                                  className="py-8 text-center text-gray-500"
                                >
                                  No results found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-xs overflow-hidden">
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

                    {/* Virtualized Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Scrollable Container - Now wraps both header and body */}
                      <div
                        ref={parentRef}
                        onScroll={handleScroll}
                        className="overflow-y-auto custom-scrollbar max-h-96 relative"
                      >
                        {/* Single table for both header and body */}
                        <table className="w-full min-w-[700px]">
                          {/* Fixed Header */}
                          <thead className="sticky top-0 z-10 bg-white">
                            <tr>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969] w-32">
                                Queue No.
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969] w-40">
                                Student ID
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969] w-48">
                                Name
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969] w-64">
                                Request
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969] w-32">
                                Time
                              </th>
                            </tr>
                          </thead>

                          {/* Body */}
                          <tbody
                            style={{
                              height: `${rowVirtualizer.getTotalSize()}px`,
                              position: "relative",
                            }}
                          >
                            {rowVirtualizer
                              .getVirtualItems()
                              .map((virtualRow) => {
                                const item =
                                  filteredNextInLine[virtualRow.index];
                                if (!item) return null;

                                return (
                                  <tr
                                    key={item.queueId || virtualRow.index}
                                    className="border-b border-[#E2E3E4] hover:bg-gray-50 transition"
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      transform: `translateY(${virtualRow.start}px)`,
                                      width: "100%",
                                    }}
                                  >
                                    <td className="text-left py-4 px-4 text-sm font-semibold w-32">
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

                                    <td className="text-left py-4 px-4 text-sm text-[#202124] w-40">
                                      {item.studentId}
                                    </td>

                                    <td className="text-left py-4 px-4 text-sm text-[#202124] w-48">
                                      <span
                                        className="truncate block max-w-[180px]"
                                        title={item.name}
                                      >
                                        {item.name}
                                      </span>
                                    </td>

                                    <td className="text-left py-4 px-4 text-sm text-[#202124] w-64">
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
                                                className="ml-2 bg-transparent text-[#1A73E8] font-semibold border border-[#1A73E8] text-xs px-2 py-0.5 rounded-full cursor-pointer flex-shrink-0"
                                                onMouseEnter={() =>
                                                  setHoveredRow(
                                                    virtualRow.index
                                                  )
                                                }
                                                onMouseLeave={() =>
                                                  setHoveredRow(null)
                                                }
                                              >
                                                +{item.requests.length - 1}
                                              </span>
                                              {hoveredRow ===
                                                virtualRow.index && (
                                                <div className="absolute bottom-full left-0 mb-2 bg-white border border-[#E2E3E4] text-black p-3 rounded-lg shadow-lg z-50 min-w-[200px] max-w-[300px]">
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

                                    <td className="text-left py-3 px-4 text-sm text-gray-900 w-32">
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
                    </div>
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

                  <div className="p-6">
                    <div className="flex items-center justify-between gap-6 h-full">
                      {/* left side */}
                      <div className="border-2 flex-1 border-[#E2E3E4] rounded-lg p-6 h-full">
                        <div className="text-left mb-4">
                          <div className="text-5xl text-center border border-[#1A73E8] rounded-xl py-3 font-bold text-blue-600 mb-2">
                            {selectedQueue.queueNo}
                          </div>
                          <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
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
                      <div className="flex flex-col flex-5 justify-between h-full">
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
                                                <Pause className="w-4 h-4" />
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
                                                <SkipForward className="w-4 h-4" />
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

                        <div className="flex gap-3 mt-8 justify-end">
                          <button
                            onClick={handleDonePanel}
                            disabled={
                              !selectedQueue.requests.every(
                                (request) =>
                                  request.status === "Completed" ||
                                  request.status === "Cancelled" ||
                                  request.status === "Skipped"
                              )
                            }
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                              selectedQueue.requests.every(
                                (request) =>
                                  request.status === "Completed" ||
                                  request.status === "Cancelled" ||
                                  request.status === "Skipped"
                              )
                                ? "bg-[#1A73E8] text-white hover:bg-blue-600 cursor-pointer"
                                : "bg-[#1A73E8]/50 text-gray-200 cursor-not-allowed"
                            }`}
                          >
                            <Check className="w-4 h-4" />
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
