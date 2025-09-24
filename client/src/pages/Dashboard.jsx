import React, { useState } from "react";

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex bg-transparent lg:w-[100%]">
 

      {/* Main Content */}
      <div className="flex-1 pl-10 pr-10 pt-3 ml-12 md:ml-65 sm:ml-12 lg:ml-0 transition-all duration-300 ease-in-out bg-red">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2> 

            {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 ">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold">Total Customers</h3>
            <p className="text-3xl font-bold text-blue-600">120</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold">Active Queues</h3>
            <p className="text-3xl font-bold text-green-600">8</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold">Average Wait Time</h3>
            <p className="text-3xl font-bold text-red-600">15m</p>
          </div>
        </div>

            {/* Current Queue */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Current Queue</h3>
          <ul className="space-y-2">
            <li className="flex justify-between p-3 rounded-lg bg-gray-100">
              <span>Customer A</span>
              <span className="text-blue-600">#001</span>
            </li>
            <li className="flex justify-between p-3 rounded-lg bg-gray-100">
              <span>Customer B</span>
              <span className="text-blue-600">#002</span>
            </li>
            <li className="flex justify-between p-3 rounded-lg bg-gray-100">
              <span>Customer C</span>
              <span className="text-blue-600">#003</span>
            </li>
          </ul>
        </div>

          {/* Staff Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Staff Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-100 rounded-lg text-center">
              <h4 className="font-bold">Jacinth</h4>
              <p className="text-sm text-gray-500">Working Scholar</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg text-center">
              <h4 className="font-bold">Lance</h4>
              <p className="text-sm text-gray-500">Working Scholar</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg text-center">
              <h4 className="font-bold">Jan Lorenz</h4>
              <p className="text-sm text-gray-500">Working Scholar</p>
            </div>
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Announcements</h3>
          <p className="text-gray-700">
            🚀 The system will automatically <span className="font-semibold">reset daily at 11:59 PM</span>.
          </p>
        </div> 
        </div>

      

    

   
    </div>
  );
}

