import React, { useState, useRef, useEffect } from "react";
import { Maximize2, Monitor } from "lucide-react";

export default function Display_Queue() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  
  const [currentServing, setCurrentServing] = useState({
    window1: { code: 'R001', type: 'Regular' },
    window2: { code: 'P001', type: 'Priority' }
  });

  const [nextInLine] = useState([
    { code: 'R002', type: 'Regular' },
    { code: 'P002', type: 'Priority' },
    { code: 'P003', type: 'Priority' },
    { code: 'R003', type: 'Regular' }
  ]);

  const [waitingCounts] = useState({
    regular: 33,
    priority: 6
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen for fullscreen changes (when user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center   lg:w-[100%]">
    <div ref={containerRef} className=" flex flex-col min-h-[90vh] bg-[#F5F5F5]  justify-center px-9">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-left text-[#202124]">Display Queue</h1>
        <button 
          onClick={toggleFullscreen}
          className="flex items-center bg-white rounded-2xl gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition cursor-pointer"
        >
          {/* <Maximize2 size={20} /> */}
          <div className="inline-block bg-white ">
              <img src="/assets/display_queue/Full Screen.png" alt="" />
              </div>
          <span className="font-medium ">{isFullscreen ? '' : 'Fullscreen'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Current Serving */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Window 1 */}
          <div className="bg-white flex flex-col py-20 bg- items-center justify-center rounded-2xl shadow-xs p-8 flex-1">
            <div className="flex items-center gap-2 text-gray-600 mb-6">
               <div className="inline-block">
              <img src="/assets/Monitor.png" alt="" />
              </div>
              <span className="text-lg text-[#686969] font-medium">Window 1</span>
            </div>
            
            <div className="text-center">
              <h2 className="text-8xl font-bold text-[#1A73E8] mb-4">
                {currentServing.window1.code}
              </h2>
              <span className="inline-block px-6 py-2 bg-[#26BA33] text-[#F5F5F5] rounded-full text-sm font-medium">
                Currently Serving
              </span>
            </div>
          </div>

          {/* Window 2 */}
          <div className="bg-white flex flex-col py-20 items-center justify-center rounded-2xl shadow-xs p-8 flex-1">
            <div className="flex items-center gap-2 text-gray-600 mb-6">
               <div className="inline-block ">
              <img src="/assets/Monitor.png" alt="" />
              </div>
              <span className="text-lg text-[#686969]font-medium">Window 2</span>
            </div>
            
            <div className="text-center">
              <h2 className="text-8xl font-bold text-[#F9AB00] mb-4">
                {currentServing.window2.code}
              </h2>
              <span className="inline-block px-6 py-2 bg-[#26BA33] text-[#F5F5F5] rounded-full text-sm font-medium">
                Currently Serving
              </span>
            </div>
          </div>
        </div>

        {/* Right Side - Next in Line & Waiting Counts */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Next in Line */}
          <div className="bg-white  flex-1 rounded-2xl shadow-xs p-8">
            <h2 className="text-3xl text-left font-bold text-[#202124] mb-6">Next in Line</h2>
            
            <div className="space-y-3">
              {nextInLine.map((item, index) => (
                <div
                  key={index}
                  className={`rounded-2xl p-6 text-center ${
                    item.type === 'Regular' 
                      ? 'bg-[#B8D4F8]' 
                      : 'bg-[#FDE5B0]'
                  }`}
                >
                  <span className="text-3xl font-bold text-[#1A73E8]">
                    {item.code}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Waiting Counts */}
          <div className="grid grid-cols-2 gap-4  bg-white p-7 rounded-2xl shadow-xs">
            {/* Regular Waiting */}
            <div className="bg-[#E8F1FD] rounded-2xl p-6 text-center">
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {waitingCounts.regular}
              </div>
              <div className="text-sm font-medium text-gray-700">
                Regular Waiting
              </div>
            </div>

            {/* Priority Waiting */}
            <div className="bg-[#FEF7E6] rounded-2xl p-6 text-center">
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {waitingCounts.priority}
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