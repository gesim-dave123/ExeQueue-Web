import {
  Check,
  ChevronDown,
  ChevronUp,
  Pause,
  SkipForward,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { checkAvailableWindow, getWindowData } from "../../api/staff.api";
import { AnnounceQueue, handleButtonClick, useAnnounceQueueStates } from  '../staffs/Announce_Queue'; 
import DynamicModal from "../../components/modal/DynamicModal";
import { showToast } from "../../components/toast/ShowToast";
import "../../index.css";
import { useSocket } from "../../utils/hooks/useSocket";
import {
  formatQueueData,
  formatQueueNextItem,
} from "../../utils/QueueDetailsFormatter";

import { SocketEvents } from "../../../../server/src/services/enums/SocketEvents.js";
import { Queue_Type } from "../../constants/queueEnums.js";


export default function Manage_Queue() {
  const [deferredOpen, setDeferredOpen] = useState(true);
  const [nextInLineOpen, setNextInLineOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deferredSearchTerm, setDeferredSearchTerm] = useState("");
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  


  // Add these states for the new flow
  const [isLoading, setIsLoading] = useState(true);
  const [showWindowModal, setShowWindowModal] = useState(false);
  const [selectedWindow, setSelectedWindow] = useState(null);
  const [availableWindows, setAvailableWindows] = useState([]);

  const { socket, isConnected } = useSocket();
  const [loading, setLoading] = useState(false);
  const { lastAnnounceTime, setLastAnnounceTime, disabledForSeconds, setDisabledForSeconds } = useAnnounceQueueStates();

  const [queueList, setQueueList] = useState([
    {
      queueNo: "R009",
      studentId: "23921845",
      name: "John Doe",
      course: "BSHM- 1st Year",
      type: "Regular",
      time: "11:21 AM",
      requests: [
        { id: 1, name: "Transmittal Letter", status: "In Progress" },
        { id: 2, name: "Good Moral Certificate", status: "In Progress" },
      ],
    },
    {
      queueNo: "R020",
      studentId: "23219823",
      name: "Kevin Durant",
      course: "BSIT - 2nd Year",
      type: "Regular",
      time: "9:05 AM",
      requests: [{ id: 1, name: "Insurance Payment", status: "In Progress" }],
    },
    {
      queueNo: "R021",
      studentId: "2323003",
      name: "Stephen Curry",
      course: "BSA - 3rd Year",
      type: "Regular",
      time: "9:07 AM",
      requests: [
        { id: 1, name: "Temporary Gate Pass", status: "In Progress" },
        { id: 2, name: "Good Moral Certificate", status: "In Progress" },
        { id: 3, name: "Insurance Payment", status: "In Progress" },
      ],
    },
    {
      queueNo: "R022",
      studentId: "23844352",
      name: "Lebron James",
      course: "BSCS - 4th Year",
      type: "Regular",
      time: "9:07 AM",
      requests: [{ id: 1, name: "Insurance Payment", status: "In Progress" }],
    },
    {
      queueNo: "R023",
      studentId: "23844362",
      name: "Dwayne Wade",
      course: "BSN - 2nd Year",
      type: "Regular",
      time: "9:08 AM",
      requests: [{ id: 1, name: "Transmittal Letter", status: "In Progress" }],
    },
    {
      queueNo: "R022",
      studentId: "23844352",
      name: "Lebron James",
      course: "BSCS - 4th Year",
      type: "Regular",
      time: "9:07 AM",
      requests: [{ id: 1, name: "Insurance Payment", status: "In Progress" }],
    },
    {
      queueNo: "R023",
      studentId: "23844362",
      name: "Dwayne Wade",
      course: "BSN - 2nd Year",
      type: "Regular",
      time: "9:08 AM",
      requests: [{ id: 1, name: "Transmittal Letter", status: "Stalled" }],
    },
    
  ]);

  const [deferredQueue, setDeferredQueue] = useState([
    {
      queueNo: "R009",
      studentId: "23921845",
      name: "John Doe",
      course: "BSHM- 1st Year",
      type: "Regular",
      time: "11:21 AM",
      requests: [
        { id: 1, name: "Transmittal Letter", status: "Stalled" },
        { id: 2, name: "Good Moral Certificate", status: "Stalled" },
      ],
    },
    {
      queueNo: "R020",
      studentId: "23219823",
      name: "Kevin Durant",
      course: "BSIT - 2nd Year",
      type: "Regular",
      time: "9:05 AM",
      requests: [{ id: 1, name: "Insurance Payment", status: "Stalled" }],
    },
    {
      queueNo: "R021",
      studentId: "2323003",
      name: "Stephen Curry",
      course: "BSA - 3rd Year",
      type: "Regular",
      time: "9:07 AM",
      requests: [
        { id: 1, name: "Temporary Gate Pass", status: "Stalled" },
        { id: 2, name: "Good Moral Certificate", status: "Stalled" },
        { id: 3, name: "Insurance Payment", status: "Stalled" },
      ],
    },
    {
      queueNo: "R022",
      studentId: "23844352",
      name: "Lebron James",
      course: "BSCS - 4th Year",
      type: "Regular",
      time: "9:07 AM",
      requests: [{ id: 1, name: "Insurance Payment", status: "Stalled" }],
    },
    {
      queueNo: "R023",
      studentId: "23844362",
      name: "Dwayne Wade",
      course: "BSN - 2nd Year",
      type: "Regular",
      time: "9:08 AM",
      requests: [{ id: 1, name: "Transmittal Letter", status: "Stalled" }],
    },
    {
      queueNo: "R022",
      studentId: "23844352",
      name: "Lebron James",
      course: "BSCS - 4th Year",
      type: "Regular",
      time: "9:07 AM",
      requests: [{ id: 1, name: "Insurance Payment", status: "Stalled" }],
    },
    {
      queueNo: "R023",
      studentId: "23844362",
      name: "Dwayne Wade",
      course: "BSN - 2nd Year",
      type: "Regular",
      time: "9:08 AM",
      requests: [{ id: 1, name: "Transmittal Letter", status: "Stalled" }],
    },
  ]);
  const [nextInLine, setNextInLine] = useState([]);

  const sortByPriorityPattern = useCallback((queues) => {
    console.log("🔢 Starting sort with queues:", queues?.length);

    if (!queues || queues.length === 0) {
      console.log("⚠️ No queues to sort");
      return [];
    }
    if (queues.length > 0) {
      console.log(
        "🔍 Available properties on first queue:",
        Object.keys(queues[0])
      );
    }
    // Debug: Log all queue types
    queues.forEach((q, index) => {
      console.log(
        `Queue ${index}: id=${q.queueId}, type=${
          q.type
        }, upper=${q.type?.toUpperCase()}`
      );
    });

    // More flexible filtering with fallbacks
    const priority = queues.filter((q) => {
      const type = q.type?.toUpperCase();
      return type === "PRIORITY";
    });
    // .sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));

    const regular = queues.filter((q) => {
      const type = q.type?.toUpperCase();
      return type === Queue_Type.REGULAR.toString().toUpperCase();
    });
    // .sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));

    console.log("📊 Priority count:", priority.length);
    console.log("📊 Regular count:", regular.length);

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

    console.log("✅ Final sorted count:", sorted.length);
    return sorted;
  }, []);
  const handleAddNewQueue = useCallback(
    (newQueueData) => {
      try {
        const formattedNewQueue = formatQueueData(newQueueData);
        const simplifiedNewQueue = formatQueueNextItem(formattedNewQueue);

        setQueueList((prev) => {
          const exists = prev.some(
            (q) => q.queueId === formattedNewQueue.queueId
          );
          console.log("Prev length:", prev.length, "Exists:", exists);

          if (exists) {
            console.log(
              "🟡 Skipped duplicate queue:",
              formattedNewQueue.queueId
            );
            return prev;
          }

          // ✅ Merge and apply your alternating sort
          const merged = [...prev, formattedNewQueue];
          const updated = sortByPriorityPattern(merged);

          console.log("✅ Updating queue list to new length:", updated.length);
          return updated;
        });

        setNextInLine((prev) => {
          if (prev.some((q) => q.queueId === simplifiedNewQueue.queueId))
            return prev;

          const merged = [...prev, simplifiedNewQueue];
          const updated = sortByPriorityPattern(merged); // ✅ same pattern for next in line
          return updated;
        });
      } catch (error) {
        console.error("Error adding new queue:", error);
      }
    },
    [sortByPriorityPattern]
  );

  const handleFormatQueueData = useCallback((queueData) => {
    try {
      const formattedQueue = queueData.map(formatQueueData);
      const simplifiedQueue = formattedQueue.map(formatQueueNextItem);

      setQueueList(formattedQueue);
      if (formattedQueue.length > 0) setCurrentQueue(formattedQueue[0]);
      setNextInLine(simplifiedQueue);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchQueueList = useCallback(() => {
    if (!socket || !isConnected) return;
    setLoading(true);
    socket.emit("fetch-queue-list");
  }, [socket, isConnected]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    fetchQueueList();

    const handleQueueCreated = (newQueueData) => {
      console.log("🔔 QUEUE_CREATED event received:", newQueueData);
      handleAddNewQueue(newQueueData);
    };

    const handleQueueListData = (data) => {
      console.log("Raw Queue Data:", data[0]);
      handleFormatQueueData(data);
      setLoading(false);
    };

    const handleError = (error) => {
      console.error("❌ Error:", error);
      setLoading(false);
    };

    socket.on("queue-list-data", handleQueueListData);
    socket.on(SocketEvents.QUEUE_CREATED, handleQueueCreated);
    socket.on("error", handleError);

    return () => {
      socket.off("queue-list-data", handleQueueListData);
      socket.off(SocketEvents.QUEUE_CREATED, handleQueueCreated);
      socket.off("error", handleError);
    };
  }, [
    socket,
    isConnected,
    fetchQueueList,
    handleAddNewQueue,
    handleFormatQueueData,
  ]);

  useEffect(() => {
    console.log("🟢 Queue list updated:", queueList);
  }, [queueList]);
  const handleRefresh = () => {
    // manual refresh
    fetchQueueList();
  };
  const [currentQueue, setCurrentQueue] = useState({
    queueNo: "",
    type: "",
    name: "",
    studentId: "",
    course: "",
    time: "",
    requests: [],
  });

  // const [nextInLine, setNextInLine] = useState([
  //   {
  //     queueNo: "P005",
  //     studentId: "23219652",
  //     name: "John Doe",
  //     course: "BSIT - 4th Year",
  //     type: "Priority",
  //     requests: ["Insurance Payment", "Transmittal Letter"],
  //     time: "9:06 AM",
  //   },
  //   {
  //     queueNo: "R020",
  //     studentId: "23219823",
  //     name: "Kevin Durant",
  //     course: "BSA - 2nd Year",
  //     type: "Regular",
  //     requests: [
  //       "Insurance Payment",
  //       "Transmittal Letter",
  //       "Good Moral Certificate",
  //     ],
  //     time: "9:05 AM",
  //   },
  //   {
  //     queueNo: "R021",
  //     studentId: "2323003",
  //     name: "Stephen Curry",
  //     course: "BSCS - 3rd Year",
  //     type: "Regular",
  //     request: "Temporary Gate Pass",
  //     time: "9:07 AM",
  //   },
  //   {
  //     queueNo: "R022",
  //     studentId: "23844352",
  //     name: "Lebron James",
  //     course: "BSN - 1st Year",
  //     type: "Regular",
  //     request: "Insurance Payment",
  //     time: "9:07 AM",
  //   },
  //   {
  //     queueNo: "R023",
  //     studentId: "23844363",
  //     name: "Chris Paul",
  //     course: "BSHM - 2nd Year",
  //     type: "Regular",
  //     request: "Transmittal Letter",
  //     time: "9:08 AM",
  //   },
  //   {
  //     queueNo: "R024",
  //     studentId: "23844364",
  //     name: "James Harden",
  //     course: "BSIT - 3rd Year",
  //     type: "Priority",
  //     request: "Good Moral Certificate",
  //     time: "9:09 AM",
  //   },
  //   {
  //     queueNo: "R022",
  //     studentId: "23844352",
  //     name: "Lebron James",
  //     course: "BSN - 1st Year",
  //     type: "Regular",
  //     request: "Insurance Payment",
  //     time: "9:07 AM",
  //   },
  //   {
  //     queueNo: "R023",
  //     studentId: "23844363",
  //     name: "Chris Paul",
  //     course: "BSHM - 2nd Year",
  //     type: "Regular",
  //     request: "Transmittal Letter",
  //     time: "9:08 AM",
  //   },
  //   {
  //     queueNo: "R024",
  //     studentId: "23844364",
  //     name: "James Harden",
  //     course: "BSIT - 3rd Year",
  //     type: "Regular",
  //     request: "Good Moral Certificate",
  //     time: "9:09 AM",
  //   },
  // ]);

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

  const handleRequestAction = (requestId, action) => {
    setCurrentQueue((prev) => ({
      ...prev,
      requests: prev.requests.map((req) => {
        if (req.id === requestId) {
          switch (action) {
            case "done":
              return { ...req, status: "Completed" };
            case "stall":
              return { ...req, status: "Stalled" };
            case "skip":
              return { ...req, status: "Skipped" };
            case "cancel":
              return { ...req, status: "Cancelled" };
            default:
              return req;
          }
        }
        return req;
      }),
    }));
  };

  const handleDeferredAction = (requestId, action) => {
    if (!selectedQueue) return;

    setDeferredQueue((prev) =>
      prev.map((queue) => {
        if (queue.queueNo === selectedQueue.queueNo) {
          return {
            ...queue,
            requests: queue.requests.map((req) => {
              if (req.id === requestId) {
                switch (action) {
                  case "done":
                    return { ...req, status: "Completed" };
                  case "stall":
                    return { ...req, status: "Stalled" };
                  case "skip":
                    return { ...req, status: "Skipped" };
                  case "cancel":
                    return { ...req, status: "Cancelled" };
                  default:
                    return req;
                }
              }
              return req;
            }),
          };
        }
        return queue;
      })
    );

    setSelectedQueue((prev) => ({
      ...prev,
      requests: prev.requests.map((req) => {
        if (req.id === requestId) {
          switch (action) {
            case "done":
              return { ...req, status: "Completed" };
            case "stall":
              return { ...req, status: "Stalled" };
            case "skip":
              return { ...req, status: "Skipped" };
            case "cancel":
              return { ...req, status: "Cancelled" };
            default:
              return req;
          }
        }
        return req;
      }),
    }));
  };

  const openActionPanel = (queue) => {
    setSelectedQueue(queue);
    setShowActionPanel(true);
  };

  const closeActionPanel = () => {
    setShowActionPanel(false);
    setSelectedQueue(null);
  };

  const handleCallNext = () => {
  try {
    // Remove current queue from the list
    const updatedQueueList = queueList.slice(1);

    if (updatedQueueList.length === 0) {
      alert("No more people in queue");
      setQueueList([]);
      setNextInLine([]);
      setCurrentQueue({
        queueNo: "",
        type: "",
        name: "",
        studentId: "",
        course: "",
        time: "",
        requests: [],
      });
      return;
    }

    // Get the next person (now first in updated list)
    const nextPerson = updatedQueueList[0];

    // Update current queue to next person
    setCurrentQueue({
      queueNo: nextPerson.queueNo,
      type: nextPerson.type,
      name: nextPerson.name,
      studentId: nextPerson.studentId,
      course: nextPerson.course,
      time: nextPerson.time,
      requests: nextPerson.requests || [],
    });

    // Update queue list (remove the old current)
    setQueueList(updatedQueueList);

    // Update next in line (remove the old current)
    setNextInLine((prev) => prev.slice(1));
    
    // Announce the new current queue
    AnnounceQueue(nextPerson.queueNo);
  } catch (error) {
    console.error("Error in handleCallNext:", error);
    alert("An error occurred while calling the next person");
  }
};
  const handleDonePanel = () => {
    // alert('Queue completed and closed');
    closeActionPanel();
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

  useEffect(() => {
    const loadWindows = async () => {
      setIsLoading(true);

      const windowData = await getWindowData();
      const windows = Array.isArray(windowData)
        ? windowData
        : windowData?.windows || [windowData];

      const windowIds = windows.map((w) => w.windowId);

      const assignedResponse = await checkAvailableWindow(windowIds);
      console.log("Assigned Response: ", assignedResponse);

      const availableWindows = assignedResponse?.availableWindows || [];
      const assignedWindows = assignedResponse?.assignedIds || [];
      const formattedWindows = windows.map((w, index) => {
        const isAvailable = availableWindows.includes(w.windowId);
        const firstAvailableId = availableWindows[0]; // first window ID in the available list

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
    };

    loadWindows();
  }, []);

  // Window selection handler
  const handleWindowSelect = async (windowId) => {
    try {
      const window = availableWindows.find((w) => w.id === windowId);
      if (window.status === "inactive") {
        showToast("This window is currently occupied/inactive", "error");
        return;
      }

      setSelectedWindow(window);
      setShowWindowModal(false);
      showToast(`Managing ${window.name}`, "success");
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  // Define window buttons for DynamicModal
  const windowButtons = availableWindows.map((window) => ({
    text: window.name,
    onClick: () => handleWindowSelect(window.id),
    className:
      window.status === "inactive"
        ? "bg-transparent bg-[#202124] ring-1 cursor-not-allowed w-full"
        : "bg-[#1A73E8] text-white hover:bg-blue-700 w-full",
    disabled: window.status === "inactive",
  }));
  // Loading Skeleton Component
  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-transparent w-full p-4 md:p-10">
      <div className="max-w-full mx-auto">
        {/* Header Skeleton */}
        <div className="h-8 bg-gray-200 rounded w-64 mb-9 mt-6 animate-pulse"></div>

        {/* Main Card Skeleton */}
        <div className="bg-white rounded-xl shadow-xs mb-4 overflow-hidden">
          <div className="p-4 md:p-6">
            {/* Window Header Skeleton */}
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gray-200 p-2 rounded-xl w-10 h-10 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>

            {/* Content Skeleton */}
            <div className="flex items-center justify-between gap-6 h-full">
              {/* Left Side Skeleton */}
              <div className="border-2 flex-1 border-[#E2E3E4] rounded-lg p-6 h-full">
                <div className="text-center mb-4">
                  <div className="h-20 bg-gray-200 rounded-xl mb-2 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded-full w-16 mx-auto animate-pulse"></div>
                </div>

                <div className="space-y-3">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item}>
                      <div className="h-3 bg-gray-200 rounded w-12 mb-1 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side Skeleton */}
              <div className="flex flex-col flex-5 justify-between">
                <div className="flex-1">
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="h-75 overflow-y-auto">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left py-5 px-4">
                              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                            </th>
                          </tr>
                          <tr>
                            {[1, 2, 3].map((item) => (
                              <th key={item} className="text-left py-3 px-4">
                                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[1, 2, 3, 4].map((row) => (
                            <tr key={row} className="border-b border-gray-200">
                              {[1, 2, 3].map((cell) => (
                                <td key={cell} className="py-3 px-4">
                                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Button Skeleton */}
                <div className="flex gap-3 mt-15 justify-end">
                  {[1, 2].map((btn) => (
                    <div
                      key={btn}
                      className="h-12 bg-gray-200 rounded-lg w-32 animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deferred and Next in Line Skeleton */}
        {[1, 2].map((section) => (
          <div key={section} className="bg-white rounded-xl shadow-xs mb-4 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded-full w-6 animate-pulse"></div>
              </div>
              <div className="h-5 bg-gray-200 rounded w-5 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div className="relative min-h-screen w-full">
      {/* Loading skeleton overlay */}
      {isLoading && <LoadingSkeleton />}

      {/* Window Selection Modal (always above skeleton) */}
      {showWindowModal && (
        <DynamicModal
          isOpen={showWindowModal}
          onClose={() => setShowWindowModal(false)}
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
      {!isLoading && (
        <div className="min-h-screen bg-transparent w-full p-4 md:p-10">
          <div className="max-w-full mx-auto">
            <h1 className="text-2xl md:text-3xl font-semibold text-left text-gray-900 mb-9 mt-6">
              Manage Queue
            </h1>

            <div className="bg-white rounded-xl shadow-xs mb-4 overflow-hidden">
              <div className="p-4 bg- md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-[#F5F5F5] p-2 rounded-xl">
                    <img src="/assets/Monitor.png" alt="" />
                  </div>
                  <span className="font-semibold text-gray-700">Window 1</span>
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
                        <div className="text-[#686969] mb-1">Student ID</div>
                        <div className="font-semibold text-[#202124]">
                          {currentQueue.studentId}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#686969] mb-1">Course & Year</div>
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
                        onClick={() => handleButtonClick(handleCallNext, disabledForSeconds, lastAnnounceTime, setDisabledForSeconds, setLastAnnounceTime)}
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
                        <img src="/assets/manage_queue/Announcement-1.png" alt="Edit" />
                        Call Next
                      </button>
                      <button
                        onClick={() => handleButtonClick(
                          () => AnnounceQueue(currentQueue.queueNo), //Announce the current queue
                          disabledForSeconds,
                          lastAnnounceTime,
                          setDisabledForSeconds,
                          setLastAnnounceTime
                        )}
                        disabled={disabledForSeconds || queueList.length === 0}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                          disabledForSeconds
                            ? "bg-[#FACC15]/50 cursor-not-allowed text-gray-200"
                            : "bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer"
                        }`}
                      >
                        <img src="/assets/manage_queue/Announcement.png" alt="Announce" />
                        Announce
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-xs mb-4 overflow-hidden">
              <button
                onClick={() => setDeferredOpen(!deferredOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">Deferred</span>
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
                        onChange={(e) => setDeferredSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Table Container */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Fixed Header */}
                    <div className="overflow-y-scroll custom-scrollbar max-h-96">
                      <table className="w-full min-w-[700px]">
                        <thead className="bg-white sticky top-0 z-50">
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
                                <td className="text-left py-3 px-4 text-sm text-[#202124] w-40 ">
                                  {item.studentId}
                                </td>
                                <td className="text-left py-3 px-4 text-sm text-[#202124]  w-48">
                                  {item.name}
                                </td>
                                <td className="text-left py-3 px-4 text-sm text-[#202124]  w-64">
                                  <div className="relative">
                                    {item.requests[0].name}
                                    {item.requests.length > 1 && (
                                      <>
                                        <span
                                          className="ml-2 bg-transparent font-semibold border-1 border-[#1A73E8]  text-[#1A73E8] text-xs px-2 py-0.5 rounded-full cursor-pointer"
                                          onMouseEnter={() =>
                                            setHoveredRow(`deferred-${index}`)
                                          }
                                          onMouseLeave={() =>
                                            setHoveredRow(null)
                                          }
                                        >
                                          +{item.requests.length - 1}
                                        </span>
                                        {hoveredRow === `deferred-${index}` && (
                                          <div className="absolute bottom-full left-0 mb-2 border border-[#E2E3E4] bg-white text-black p-3 rounded-lg shadow-lg z-50 min-w-[200px]">
                                            {item.requests
                                              .slice(1)
                                              .map((req, idx) => (
                                                <div
                                                  key={idx}
                                                  className="py-1 text-xs"
                                                >
                                                  {/* {idx + 2}.  */}
                                                  {req.name}
                                                </div>
                                              ))}
                                            <div className="absolute top-full left-38 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent"></div>
                                          </div>
                                        )}
                                      </>
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
                    {nextInLine.length}
                  </span>
                </div>
                {nextInLineOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {nextInLineOpen && (
                <div className="p-4 ">
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

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-y-scroll custom-scrollbar max-h-96">
                      <table className="w-full min-w-[700px] ">
                        <thead className=" sticky top-0 bg-white z-50 ">
                          <tr className="border-b border-[#E2E3E4]">
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
                        <tbody>
                          {filteredNextInLine.length > 0 ? (
                            filteredNextInLine.map((item, index) => (
                              <tr
                                key={index}
                                className="border-b border-[#E2E3E4] hover:bg-gray-50 transition"
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
                                  {item.name}
                                </td>
                                <td className="text-left py-4 px-4 text-sm text-[#202124] w-64">
                                  {item.request ? (
                                    <div className="relative ">
                                      {item.request[0]}
                                      {item.request.length > 1 && (
                                        <>
                                          <span
                                            className="ml-2 bg-transparent text-[#1A73E8]  font-semibold border-1 border-[#1A73E8] text-xs px-2 py-0.5 rounded-full cursor-pointer"
                                            onMouseEnter={() =>
                                              setHoveredRow(index)
                                            }
                                            onMouseLeave={() =>
                                              setHoveredRow(null)
                                            }
                                          >
                                            +{item.request.length - 1}
                                          </span>
                                          {hoveredRow === index && (
                                            <div className="absolute bottom-full left-0 mb-2 bg-white border border-[#E2E3E4] text-black p-3 rounded-lg shadow-lg z-50 min-w-[200px]">
                                              {item.request
                                                .slice(1)
                                                .map((req, idx) => (
                                                  <div
                                                    key={idx}
                                                    className="py-1 text-xs "
                                                  >
                                                    {/* {idx + 2}. */}
                                                    {req}
                                                  </div>
                                                ))}
                                              <div className="absolute top-full left-38 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent "></div>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  ) : (
                                    <>
                                      {item.request}
                                      {item.count && (
                                        <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                                          +{item.count}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </td>
                                <td className="text-left py-3 px-4 text-sm text-gray-900">
                                  {item.time}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="5"
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
                          disabled={selectedQueue.requests.some(
                            (request) => request.status === "Stalled"
                          )}
                          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                            selectedQueue.requests.some(
                              (request) => request.status === "Stalled"
                            )
                              ? "bg-[#1A73E8]/50 text-gray-200 cursor-not-allowed"
                              : "bg-[#1A73E8] text-white hover:bg-blue-600 cursor-pointer"
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
      )}
    </div>
  );
}
