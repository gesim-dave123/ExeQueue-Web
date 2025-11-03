import { useEffect, useRef, useState } from "react";
import { SSE } from "../../api/sseApi";
import { fetchLiveDataStats } from "../../api/statistics";
import icon from "/assets/icon.svg";

export default function Display_Queue() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

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
  const getStats = async () => {
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
      setLoading(false);
    }
  };

  useEffect(() => {
    getStats();

    SSE.subscribe("statistics/queue/live", (data) => {
      if (data.type === "live-display-update") {
        console.log("Received live display update:", data);
        getStats();
      }
    });

    return () => SSE.unsubscribe("statistics/queue/live");
  }, []);

  // Listen for fullscreen changes (when user presses ESC)
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
      const key = `window${window.windowNo}`; // ✅ Correct property name
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

  return (
    <div className="min-h-screen flex flex-col justify-start lg:w-[100%]">
      <div
        ref={containerRef}
        className={`flex justify-start flex-col min-h-[90vh] bg-[#F5F5F5] pb-15 xl:pl-9 pr-8 overflow-y-auto
            ${
              isFullscreen
                ? "flex pl-8 lg:pl-7"
                : "md:pl-15 pt-15 xl:pb-5 lg:pt-15 2xl:pt-18 justify-center "
            }`}      >

          <div
          className={`flex items-center justify-center ${
            isFullscreen ? "flex" : "hidden"
          }`}
        >
          <img src={icon} alt="Exequeue Logo" className="w-[10vh]" />
          <h1
            className="text-2xl font-bold "
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            ExeQueue
          </h1>
        </div>
        {/* Header */}
        <div
          className={`mb-6
         ${isFullscreen ? "hidden" : "flex justify-between"}`}
        >
          <h1
            className={`text-3xl font-semibold text-left text-[#202124]
          ${isFullscreen ? "hidden" : "flex"}`}
          >
            Display Queue
          </h1>
          <button
            onClick={toggleFullscreen}
            className="flex items-center bg-white rounded-2xl gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition cursor-pointer"
          >
            {/* <Maximize2 size={20} /> */}
            <div className="inline-block bg-white ">
              <img src="/assets/display_queue/Full Screen.png" alt="" />
            </div>
            <span className="font-medium hidden sm:flex">
              {isFullscreen ? "" : " Fullscreen"}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
          {/* Left Side - Current Serving */}
          {/* // Left Side - Current Serving */}
          <div className="space-y-6 flex flex-col justify-between">
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
                  className="bg-white flex flex-col py-20 items-center justify-center rounded-2xl shadow-xs p-8 flex-1"
                >
                  <div className="flex items-center gap-2 text-gray-600 mb-6">
                    <div className="inline-block">
                      <img
                        src="/assets/Monitor.png"
                        alt={`Window ${windowNumber}`}
                      />
                    </div>
                    <span className="text-lg text-[#686969] font-medium">
                      Window {windowNumber}
                    </span>
                  </div>

                  <div className="text-center">
                    <h2
                      className={`text-8xl font-bold mb-4 ${
                        windowData?.type === "Priority"
                          ? "text-[#F9A825]"
                          : windowData?.type === "Regular"
                          ? "text-[#1A73E8]"
                          : "text-[#686969]"
                      }`}
                    >
                      {hasNumber
                        ? windowData?.number !== "0"
                          ? windowData?.number
                          : "-"
                        : windowData?.type === "Priority"
                        ? "P000"
                        : windowData?.type === "Regular"
                        ? "R000"
                        : "-"}
                    </h2>
                    <span
                      className={`inline-block px-6 py-2 rounded-full text-sm font-medium ${
                        isVacant
                          ? "text-[#686969] bg-[#E2E3E4]" // Greyed out for vacant
                          : "bg-[#26BA33] text-[#F5F5F5]" // Normal style
                      }`}
                    >
                      {isVacant ? "Vacant" : "Currently Serving"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Right Side - Next in Line & Waiting Counts */}
          <div className="space-y-6 flex flex-1 flex-col justify-between">
            {/* Next in Line */}
            <div className="bg-white flex flex-1 flex-col rounded-2xl shadow-xs p-8">
              <h2 className="text-3xl text-left font-bold text-[#202124] mb-6">
                Next in Line
              </h2>

              <div className="space-y-3 flex  justify-center flex-col ">
                {mappedNextInLine.map((item, index) => (
                  <div
                    key={index}
                    className={`rounded-2xl p-10 xl:flex-1 items-center flex justify-center text-center ${
                      item.type === "Regular" ? "bg-[#B8D4F8]" : "bg-[#FDE5B0]"
                    }`}
                  >
                    <span
                      key={index}
                      className={`text-5xl font-bold text-[#1A73E8]
                    ${isFullscreen ? "text-5xl" : "xl:text-3xl"}`}
                    >
                      {item.number}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Waiting Counts */}
            <div
              className={`grid grid-cols-2 gap-4 bg-white p-7 rounded-2xl shadow-xs 
            ${isFullscreen ? "mb-10 xl:mb-0" : ""}`}
            >
              {/* Regular Waiting */}
              <div className="bg-[#E8F1FD] rounded-2xl p-6 text-center">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {totalRegularWaiting}
                </div>
                <div className="text-sm font-medium text-gray-700">
                  Regular Waiting
                </div>
              </div>

              {/* Priority Waiting */}
              <div className="bg-[#FEF7E6] rounded-2xl p-6 text-center">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {totalPriorityWaiting}
                </div>
                <div className="text-sm font-medium text-gray-700">
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
