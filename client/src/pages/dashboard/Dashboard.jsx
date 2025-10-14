import React, { useState } from "react";
import DoughnutChart from "../../components/graphs/DoughnutChart";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Today");

  const stats = {
    total: 213,
    categories: [
      { name: "Priority", percentage: 15.5, color: "bg-[#FDE5B0]", count: 33 },
      { name: "Regular", percentage: 66.7, color: "bg-[#1A73E8]", count: 142 },
      {
        name: "In Progress",
        percentage: 17.8,
        color: "bg-[#E2E3E4]",
        count: 38,
      },
    ],
  };

  return (
    <div className="min-h-screen py-15 xl:py-0 flex bg-transparent w-full ">
      {/* Main Content */}
      <div className="flex-1 pr-8 xl:pt-17 md:px-8 md:pl-15 xl:pl-9 transition-all duration-300 ease-in-out">
        {/* Header */}
        <div className="mb-6 text-left">
          <h2 className="text-3xl font-semibold text-[#202124]">Dashboard</h2>
          <span className="text-sm md:text-base text-[#686969]">
            Your Queue Management Snapshot
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          {/* Card 1 */}
          <div className="bg-white rounded-xl shadow-xs  p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-[#F5F5F5] p-2 rounded-xl">
                <img src="/assets/Monitor.png" alt="" />
              </div>
              <h3 className="text-base md:text-lg font-medium text-[#202124]">
                Window 1
              </h3>
            </div>
            <p className="text-3xl md:text-5xl font-bold text-[#1A73E8] mt-7 text-start ">
              R001
            </p>
            <div className="flex justify-start">
              <button className="bg-[#26BA33]/20 py-1 px-5 rounded-2xl text-[#26BA33] text-xs md:text-sm lg:text-md font-medium">
                Currently Serving
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl shadow-xs p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-[#F5F5F5] p-2 rounded-xl">
                <img src="/assets/Monitor.png" alt="" />
              </div>
              <h3 className="text-base md:text-lg font-medium text-[#202124]">
                Window 2
              </h3>
            </div>
            <p className="text-3xl md:text-5xl font-bold text-[#F9AB00] mt-7 text-start">
              P002
            </p>
            <div className="flex justify-start">
              <button className="bg-[#26BA33]/20 py-1 px-5 rounded-2xl text-[#26BA33] text-xs md:text-sm lg:text-md font-medium">
                Currently Serving
              </button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl shadow-xs p-5 flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#F5F5F5] p-2 rounded-xl">
                <img src="/assets/person icon.png" alt="" />
              </div>
              <h3 className="text-base md:text-lg font-medium text-[#202124]">
                Total Regular
              </h3>
            </div>
            <p className="text-4xl md:text-6xl font-semibold text-[#202124] xl:text-start">
              142
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-xl shadow-xs p-5 flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#F5F5F5] p-2 rounded-xl">
                <img src="/assets/star icon.png" alt="" />
              </div>
              <h3 className="text-base md:text-lg font-medium text-[#202124]">
                Total Priority
              </h3>
            </div>
            <p className="text-4xl md:text-6xl font-semibold text-[#202124] xl:text-start">
              38
            </p>
          </div>
        </div>

        {/* Charts + Stats */}
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Doughnut Chart Section */}
          <div className="w-full xl:w-2/3 bg-white rounded-xl shadow-xs flex flex-col">
            <div className="flex justify-between items-center w-full mb-4 p-5">
              <div className="flex items-center gap-3">
                <div className="bg-[#F5F5F5] p-2 rounded-xl">
                  <img src="/assets/queue summary.png" alt="" />
                </div>
                <h2 className="text-lg md:text-xl font-medium text-gray-800">
                  Today's Queue Summary
                </h2>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-6">
              <div className="w-28 sm:w-40 md:w-48 flex justify-center">
                <DoughnutChart />
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-col sm:flex-row sm:justify-center gap-4">
                {stats.categories.map((category) => (
                  <div
                    key={category.name}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${category.color}`}
                    ></div>
                    <span className="text-gray-600">{category.name}</span>
                    <span className="font-medium text-[#202124]">
                      {category.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Today Stats */}
          <div className="w-full xl:w-1/3 bg-white rounded-xl shadow-xs p-6 flex flex-col">
            <div className="flex items-center gap-3">
              <div className="bg-[#F5F5F5] p-2 rounded-xl">
                <img src="/assets/calendar icon.png" alt="" />
              </div>
              <span className="text-lg font-medium">Today</span>
            </div>

            <div className="flex flex-col mt-6 space-y-6">
              <div className="flex flex-col h-full xl:h-[20vh] py-6 border border-gray-200 rounded-2xl text-center justify-center">
                <span className="font-medium">Completed</span>
                <span className="text-[#1A73E8] text-3xl md:text-6xl font-semibold">
                  180
                </span>
              </div>
              <div className="flex flex-col h-full xl:h-[20vh]  py-6 border border-gray-200 rounded-2xl text-center justify-center">
                <span className="font-medium">In Progress</span>
                <span className="text-[#1A73E8] text-3xl md:text-6xl font-semibold">
                  33
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
