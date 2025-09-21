import React, { useState } from "react";

export default function Sidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
           className={`fixed inset-0 bg-black z-40 md:hidden transition-opacity duration-300 ease-in-out ${
          isSidebarOpen ? "opacity-50 visible" : "opacity-0 invisible"
            }`}
            onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      
      <div
        className={`bg-white shadow-lg h-screen transition-all duration-300 ease-in-out flex flex-col fixed lg:relative z-50 ${
          isSidebarOpen ? "w-64" : "md:w-64 w-12 lg:w-64"
        }`}
      >
        {/* Top Section */}
        <div className="flex items-center justify-between pr-4 pt-4 pb-4 shadow-lg">
          <div className="flex items-center">
            <img
              src="public/assets/icon.svg"
              alt="logo"
              className="w-15 h-15 sm:pl-2"
            />
            {/* Show text only when sidebar is open */}
            <h1 className="hidden md:block ml-2 text-lg font-bold">ExeQueue</h1>
            {isSidebarOpen && (
              <h1 className="md:hidden ml-2 text-lg font-bold">ExeQueue</h1>
            )}
          </div>

          {/* Hamburger button for mobile */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-10 h-10 text-gray-700 hover:text-blue-600 cursor-pointer focus:outline-none"
            >
              {isSidebarOpen ? (
                <i className="fas fa-times text-xl"></i>
              ) : (
                <i className="fas fa-bars text-xl"></i>
              )}
            </button>
          </div>
        </div>


         {isSidebarOpen && (
            <div className="md:hidden flex-col p-4 space-y-2">
          <a className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-blue-100 transition">
            <i className="fas fa-home"></i> 
            <span>Dashboard</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-blue-100 transition">
            <i className="fas fa-list"></i> 
            <span>Queue</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-blue-100 transition">
            <i className="fas fa-chart-bar"></i> 
            <span>Reports</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-blue-100 transition">
            <i className="fas fa-cog"></i> 
             <span>Settings</span>
          </a>
        </div>
        )} 

        {/* Nav Items */}
        <div className="hidden md:flex flex-col p-4 space-y-2">
          <a className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-blue-100 transition">
            <i className="fas fa-home"></i> 
            <span>Dashboard</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-blue-100 transition">
            <i className="fas fa-list"></i> 
            <span>Queue</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-blue-100 transition">
            <i className="fas fa-chart-bar"></i> 
            <span>Reports</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-blue-100 transition">
            <i className="fas fa-cog"></i> 
             <span>Settings</span>
          </a>
        </div>
      </div>
    </>
  );
}
