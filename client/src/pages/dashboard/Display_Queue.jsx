import { useEffect, useRef, useState } from "react";
import { SSE } from "../../api/sseApi";
import { fetchLiveDataStats } from "../../api/statistics";
import { InlineLoading } from "../../components/InLineLoader";
import icon from "/assets/icon.svg";

export default function Display_Queue() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const isFetchingRef = useRef(false); // Prevent concurrent fetches

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current
        ?.requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error("Error attempting to enable fullscreen:", err);
        });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  const getStats = async (isInitialLoad = false) => {
    // Prevent concurrent requests
    if (isFetchingRef.current) {
      console.log("Fetch already in progress, skipping...");
      return;
    }

    isFetchingRef.current = true;

    if (isInitialLoad) {
      setIsDataLoading(true);
    }

    try {
      const response = await fetchLiveDataStats();
      console.log("Live Data Stats Response:", response);
      if (response.success) {
        setStats(response.data);
        setErrorMsg("");
      } else {
        setErrorMsg(response.message || "Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setErrorMsg("Failed to load dashboard data");
    } finally {
      isFetchingRef.current = false;

      if (isInitialLoad) {
        setIsDataLoading(false);
        // Only set page loading to false after initial data is loaded
        setIsPageLoading(false);
      }
    }
  };

  useEffect(() => {
    getStats(true);

    // Set up SSE subscription
    SSE.subscribe("statistics/queue/live", (data) => {
      if (data.type === "live-display-update") {
        console.log("Received live display update:", data);
        // Silent updates - don't show loading indicator
        getStats(false);
      }
    });

    return () => {
      SSE.unsubscribe("statistics/queue/live");
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const totals = stats?.totals || {};
  const nextInLineData = stats?.totals?.nextInLine || [];
  const formattedCurrentServing = (stats?.windows || []).reduce(
    (acc, window) => {
      const key = `window${window.windowNo}`;
      acc[key] = {
        number: window.currentServing?.formattedQueueNumber || "0",
        type:
          window.currentServing?.queueType === "PRIORITY"
            ? "Priority"
            : window.currentServing?.queueType === "REGULAR"
            ? "Regular"
            : "None",
      };
      return acc;
    },
    {}
  );

  const mappedNextInLine = nextInLineData.map((n) => ({
    number: n.formattedQueueNumber,
    type:
      n.queueType === "PRIORITY"
        ? "Priority"
        : n.queueType === "REGULAR"
        ? "Regular"
        : "Unknown",
  }));

  const totalRegularWaiting = totals.totalRegularWaiting || 0;
  const totalPriorityWaiting = totals.totalPriorityWaiting || 0;

  if (isPageLoading) {
    return (
      <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
        <InlineLoading
          text="Loading Display Queue..."
          isVisible={true}
          size="largest"
        />
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-[#F5F5F5]">
      <div
        ref={containerRef}
        className={`flex flex-col h-full w-full bg-[#F5F5F5] overflow-hidden ${
          isFullscreen
            ? "p-5"
            : "pb-10 pt-15 xl:pt-17 xl:px-9 xl:pr-7 lg:pr-7 md:pl-15 pr-3"
        }`}
      >
        {/* Fullscreen Logo Header */}
        <div
          className={`flex items-center justify-center mb-2 ${
            isFullscreen ? "flex" : "hidden"
          }`}
        >
          <img
            src={icon}
            alt="Exequeue Logo"
            className="w-[6vh] min-w-[40px]"
          />
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            ExeQueue
          </h1>
        </div>

        {/* Non-Fullscreen Header */}
        <div
          className={`flex justify-between items-center mb-4 flex-shrink-0 ${
            isFullscreen ? "hidden" : "flex"
          }`}
        >
          <h1 className="text-3xl font-semibold text-left text-[#202124]">
            Display Queue
          </h1>
          <button
            onClick={toggleFullscreen}
            className="flex items-center bg-white rounded-xl sm:rounded-2xl gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1 sm:py-2 text-gray-700 hover:text-gray-900 transition cursor-pointer text-xs sm:text-sm"
          >
            <div className="inline-block bg-white w-3 h-3 sm:w-4 sm:h-4">
              <img
                src="/assets/display_queue/Full Screen.png"
                alt="Fullscreen"
                className="w-full h-full"
              />
            </div>
            <span className="font-medium hidden xs:flex">Fullscreen</span>
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-6 flex-1 overflow-hidden min-h-0">
          {/* Left Side - Current Serving */}
          <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 lg:gap-6 h-full overflow-hidden min-h-0">
            {[1, 2].map((windowNumber) => {
              const windowData =
                formattedCurrentServing?.[`window${windowNumber}`];
              const isVacant = windowData?.number === "0";
              const hasNumber =
                windowData?.number && windowData.number !== "0"
                  ? windowData.number
                  : "-";

              return (
                <div
                  key={windowNumber}
                  className="bg-white flex flex-col items-center justify-center rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm flex-1 p-2 sm:p-3 md:p-4 lg:p-6 overflow-hidden min-h-0"
                >
                  <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-2 sm:mb-3 md:mb-4">
                    <div className="inline-block w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6">
                      <img
                        src="/assets/Monitor.png"
                        alt={`Window ${windowNumber}`}
                        className="w-full h-full"
                      />
                    </div>
                    <span className="text-xs sm:text-sm md:text-base lg:text-lg text-[#686969] font-medium">
                      Window {windowNumber}
                    </span>
                  </div>

                  <div className="text-center w-full">
                    <h2
                      className={`text-5xl lg:text-6xl xl:text-8xl font-bold mb-1 sm:mb-2 md:mb-3 leading-tight ${
                        windowData?.type === "Priority"
                          ? "text-[#F9A825]"
                          : windowData?.type === "Regular"
                          ? "text-[#1A73E8]"
                          : "text-gray-400"
                      }`}
                    >
                      {hasNumber
                        ? windowData?.number !== "0"
                          ? windowData?.number
                          : ""
                        : windowData?.type === "Priority"
                        ? "P000"
                        : windowData?.type === "Regular"
                        ? "R000"
                        : " "}
                    </h2>
                    <span
                      className={`inline-block px-2 sm:px-3 md:px-4 py-0.5 sm:py-1 md:py-1.5 rounded-full text-xs font-medium ${
                        isVacant
                          ? "text-[#686969] bg-transparent"
                          : "bg-[#26BA33] text-white"
                      }`}
                    >
                      {isVacant ? "" : "Currently Serving"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Side - Next in Line & Waiting Counts */}
          <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 lg:gap-6 h-full overflow-hidden min-h-0">
            {/* Next in Line */}
            <div className="bg-white flex flex-col rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm p-2 sm:p-3 md:p-4 lg:p-6 flex-[2] overflow-hidden min-h-0">
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl text-left font-bold text-[#202124] mb-2 sm:mb-3 md:mb-4 flex-shrink-0">
                Next in Line
              </h2>

              <div className="h-full overflow-hidden min-h-0">
                {mappedNextInLine.length > 0 ? (
                  <div
                    className={`flex flex-col gap-1 xs:gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 
                          ${mappedNextInLine.length === 1 ? "h-auto" : ""}  
                            ${
                              mappedNextInLine.length > 2 ? "h-full" : "h-1/2"
                            }`}
                  >
                    {mappedNextInLine.map((item, index) => (
                      <div
                        key={index}
                        className={`rounded-md xs:rounded-lg sm:rounded-xl md:rounded-2xl 
                                          p-1.5 xs:p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5 
                                          flex items-center justify-center text-center 
                                          flex-1 min-h-0 ${
                                            item.type === "Regular"
                                              ? "bg-[#B8D4F8]"
                                              : "bg-[#FDE5B0]"
                                          }`}
                      >
                        <span
                          className={`text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold ${
                            item.type === "Regular"
                              ? "text-[#1A73E8]"
                              : "text-[#F9A825]"
                          }`}
                        >
                          {item.number}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs xs:text-sm sm:text-base md:text-lg">
                    No one in line
                  </div>
                )}
              </div>
            </div>

            {/* Waiting Counts */}
            <div className="grid grid-cols-2 gap-1 sm:gap-2 md:gap-3 lg:gap-4 bg-white p-2 sm:p-3 md:p-4 lg:p-5 rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm flex-1 overflow-hidden min-h-0">
              {/* Regular Waiting */}
              <div className="bg-[#E8F1FD] rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 lg:p-5 text-center flex flex-col justify-center">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-1 leading-tight">
                  {totalRegularWaiting}
                </div>
                <div className="text-xs font-medium text-gray-700 leading-tight">
                  Regular Waiting
                </div>
              </div>

              {/* Priority Waiting */}
              <div className="bg-[#FEF7E6] rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 lg:p-5 text-center flex flex-col justify-center">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-1 leading-tight">
                  {totalPriorityWaiting}
                </div>
                <div className="text-xs font-medium text-gray-700 leading-tight">
                  Priority Waiting
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
