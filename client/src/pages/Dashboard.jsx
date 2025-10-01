import React, { useState } from "react";
import BarGraph from "../components/graphs/BarGraph";
import DoughnutChart from "../components/graphs/DoughnutChart";
export default function Dashboard() {

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Chart.js data format
  const basicData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'Sales',
        data: [120, 150, 180, 90],
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
      },
    ],
  };

  // Example 2: Multiple datasets
  const multiDataset = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Product A',
        data: [65, 59, 80, 81, 56],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Product B',
        data: [28, 48, 40, 19, 86],
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  };

  const customOptions = {
    plugins: {
      title: {
        display: true,
        text: 'Monthly Sales Performance',
        font: {
          size: 16,
        },
      },
      legend: {
        position: 'bottom',
      },
    },
  };


  //this is for doughnut chart
   const [activeTab, setActiveTab] = useState('Today');

  const stats = {
    total: 213,
    categories: [
      { name: 'Priority', percentage: 15.5, color: 'bg-[#FDE5B0]', count: 33 },
      { name: 'Regular', percentage: 66.7, color: 'bg-[#1A73E8]', count: 142 },
      { name: 'In Progress', percentage: 17.8, color: 'bg-[#E2E3E4]', count: 38 },
    ]
  };
  return (
    <div className="min-h-screen py-9 flex bg-transparent lg:w-[100%]">
      {/* Main Content */}
      <div className="flex-1 pl-10 pr-10 pt-3 ml-12 md:ml-65 sm:ml-12 lg:ml-0 transition-all duration-300 ease-in-out bg-[#F5F5F5]">
        <div className="text-left mb-5 mt-4">
         <h2 className="text-3xl font-semibold text-left text-[#202124]">Dashboard</h2> 
          <span className="text-left text-[#686969]">Your Queue Management Snapshot</span>
        </div>
    

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 text-left">
          <div className="bg-white rounded-xl shadow-xs p-6 flex flex-col gap-3 ">
            <div className="flex items-center gap-3 mb-3">
              <div className="inline-block bg-[#F5F5F5] p-2 rounded-xl mb-2">
              <img src="/assets/Monitor.png" alt="" />
              </div>
            <h3 className="text-lg font-medium text-[#202124]">Window 1</h3>
            </div>
            <div>
            <p className="text-5xl font-bold text-[#1A73E8]">R001</p>

            </div>
            <div>
              <button className="bg-[#26BA33]/20 py-1 px-2 rounded-2xl text-[#26BA33] text-md font-medium">Currently Serving</button>

            </div>
          </div>

          {/* <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold">Window 2</h3>
            <p className="text-5xl font-bold text-[#F9AB00]">R001</p>
            <span>Currently Serving</span>
          </div> */}

            <div className="bg-white rounded-xl shadow-xs p-6 flex flex-col gap-3 ">
            <div className="flex items-center gap-3 mb-3">
              <div className="inline-block bg-[#F5F5F5] p-2 rounded-xl mb-2">
              <img src="/assets/Monitor.png" alt="" />
              </div>
            <h3 className="text-lg font-medium 202124">Window 2</h3>
            </div>
            <div>
            <p className="text-5xl font-bold text-[#F9AB00]">P002</p>

            </div>
            <div>
              <button className="bg-[#26BA33]/20 py-1 px-2 rounded-2xl text-md text-[#26BA33] font-medium">Currently Serving</button>

            </div>
          </div>
          <div className="bg-white rounded-xl shadow-xs p-6 flex flex-col justify-between">
            <div className="flex gap-3 items-center">
                 <div className="inline-block bg-[#F5F5F5] p-2 rounded-xl mb-2">
              <img src="/assets/person icon.png" alt="" />
              </div>
            <h3 className="text-lg font-medium text-[#202124]">Total Regular</h3>

            </div>
            <div>
            <p className="text-7xl font-semibold text-left text-[#202124]">142</p>

            </div>
          </div>
          <div className="bg-white rounded-xl shadow-xs p-6 flex flex-col justify-between">
           <div className="flex gap-3 items-center">
              <div className="inline-block bg-[#F5F5F5] p-2 rounded-xl mb-2">
              <img src="/assets/star icon.png" alt="" />
              </div>
            <h3 className="text-lg font-medium text-[#202124]">Total Priority</h3>

            </div>
            <div>
            <p className="text-7xl font-semibold text-left text-[#202124]">38</p>

            </div>
          </div>
        </div>

        <div className="flex gap-5 flex-2">
          {/* Chart Section */}
           {/* Header */}
          <div className="flex flex-2 bg-white rounded-xl shadow-xs  flex-col  mb-2">
            <div className="flex justify-between w-full mb-4 p-5">
              <div className="flex items-center gap-3">
                 <div className="inline-block bg-[#F5F5F5] p-2 rounded-xl mb-2">
                  <img src="/assets/queue summary.png" alt="" />
                </div>
              <h2 className="text-xl font-medium text-gray-800">Today's Queue Summary</h2>

              </div>
              {/* <div className="flex space-x-2">
                {['Today', 'This Week'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div> */}
            </div>
         
        

          {/* Total Queue */}
          {/* <div className="text-center mb-6">
            <div className="text-4xl font-bold text-gray-800 mb-1">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Queue</div>
          </div> */}

          <div className="flex items-center justify-center flex-col bg ">
            {/* Doughnut Chart */}
            <div className="flex-1 flex items-center justify-center max-w-[140px]">
              <DoughnutChart  />
            </div>

            {/* Legend */}
              <div className="flex-1 py-10 ">
                <div className="flex flex-row justify-between space-x-4 gap-15">
                  {stats.categories.map((category, index) => (
                    <div key={category.name} className="flex flex-col items-center text-center">
                      <div className="flex items-center justify-between space-x-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                        <span className="text-sm font-medium text-[#686969] whitespace-nowrap">
                          {category.name}
                        </span>
                        <span className="text-md font-medium text-[#202124] whitespace-nowrap">          
                          {category.percentage}%
                        </span>
                      </div>
                      {/* <div className="text-xs text-gray-500">
                        {category.count}
                      </div> */}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Today's Stats */}
          <div className="flex-1 bg-white rounded-xl shadow-xs p-6 flex flex-col mb-2 ">
            <div className="flex  gap-3 items-center">
              <div className="inline-block bg-[#F5F5F5] p-2 rounded-xl  ">
              <img src="/assets/calendar icon.png" alt="" />
              </div>
              <span className="text-lg font-medium">Today</span>
            </div>
            <div className="flex flex-col justify-center items-center mt-6 space-y-3 gap-3  ">
              <div className="flex flex-col py-10   border border-gray-200 rounded-3xl w-full">
                <span className="font-medium">Completed </span>
                <span className="text-[#1A73E8] text-7xl font-semibold">180</span>
              </div>
              <div className="flex flex-col py-10 border border-gray-200 rounded-3xl w-full">
                <span className="font-medium">In Progress </span>
                <span className="text-[#1A73E8] text-7xl font-semibold">33</span>
              </div>
            
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}