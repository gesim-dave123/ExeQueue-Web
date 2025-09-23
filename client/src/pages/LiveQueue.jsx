import React from "react";

export default function LiveQueue() {
  return (
    <div className="min-h-screen w-full  flex flex-col py-6 px-20">
      {/* Header */}
      <div className="flex gap-100   mb-6">
        <div>
        <h1 className="text-2xl font-bold text-gray-800 text-left">Queue Status</h1>

        </div>
        <div>
        <input
          type="text"
          placeholder="Search by Student ID"
          className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-150"
        />
        </div>
     
      </div>

      {/* Main Content  BLACK COVER*/}
      <div className="flex lg:grid-cols-4 gap-6 w-full  h-full place-items-center  flex-1"> 
        {/* Left Side: Current Serving  OR THE ORANGE COVER */}
        <div className="grid grid-cols-1  w-full min-h-[85vh]  gap-10"> 
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 ">
            <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center gap-5 text-2xl">
              <p className="text-gray-600 mb-2">💻 Window 1</p>
              <h2 className="text-8xl font-extrabold text-blue-600">R02</h2>
              <span className="mt-3 px-4 py-3 text-sm rounded-full bg-green-500 text-white">
                Currently Serving
              </span>
            </div>

            <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center gap-5  text-2xl">
              <p className="text-gray-600 mb-2">💻 Window 2</p>
              <h2 className="text-8xl font-extrabold text-yellow-500">P01</h2>
              <span className="mt-3 px-4 py-3 text-sm rounded-full bg-green-500 text-white">
                Currently Serving
              </span>
            </div>
          </div>

          {/* Upcoming Queues */}
          <div className="bg-white rounded-xl shadow p-6 flex flex-col">
            <h3 className="font-semibold text-gray-800 mb-4">Upcoming</h3>
            {/* YELLOW COVER */}
            <div className="grid grid-cols-2 gap-4 flex-1 " >
              {/* Regular */}
              <div>
                <h4 className="text-gray-600 mb-2">Regular</h4>
                <ul className="space-y-1">
                  {["R03", "R04", "R05", "R06", "R07", "R08"].map((num) => (
                    <li
                      key={num}
                      className="px-3 py-1 bg-blue-100 rounded text-blue-800 font-medium"
                    >
                      {num}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Priority */}
              <div>
                <h4 className="text-gray-600 mb-2">Priority</h4>
                <ul className="space-y-1">
                  {["P02", "P03", "P04", "P05", "P06", "P07"].map((num) => (
                    <li
                      key={num}
                      className="px-3 py-1 bg-yellow-100 rounded text-yellow-800 font-medium"
                    >
                      {num}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

           
          </div>
           {/* Queue Counts or the brown cover */}
            <div className="flex flex-col gap-4 mt-6   ">
              <div className="bg-blue-100 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-800">33</p>
                <p className="text-gray-600 text-sm">Regular Queue Waiting</p>
              </div>
              <div className="bg-yellow-100 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-800">6</p>
                <p className="text-gray-600 text-sm">Priority Queue Waiting</p>
              </div>
            </div>
        </div>
        {/* Right Side: User Info */}
        <div className="bg-white rounded-xl w-1/4 min-h-[65vh] gap-10 shadow p-6 flex flex-col justify-center text-left">
        <div className="gap-10">
          <h3 className="font-semibold text-gray-800 mb-4">Your Information</h3>
          <p className="text-sm text-gray-600 grid grid-cols-2 gap-4">
            <span>Full name:</span>
            <span className="font-semibold text-gray-800 text-right">
              Laroco, Jan Lorenz A.
            </span>
          </p>
          <p className="text-sm text-gray-600 grid grid-cols-2 gap-4">
            <span>Student ID: </span>
            <span className="font-semibold text-gray-800 text-right">23123457</span>
          </p>
          <p className="text-sm text-gray-600 mb-2">
            Queue Type:{" "}
            <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-xs">
              Regular
            </span>
          </p>
          <p className="text-sm font-medium text-gray-800 mt-2">Service:</p>
          <ul className="list-disc ml-5 text-sm text-gray-700 mb-4">
            <li>Good Moral Certificate</li>
            <li>Insurance Payment</li>
            <li>Temporary Gate Pass</li>
          </ul>
        </div>
          

          <div className="bg-blue-50 p-4 rounded-xl text-center mb-4">
            <p className="text-gray-600 text-sm">Your Queue Number</p>
            <p className="text-3xl font-bold text-blue-600">P08</p>
          </div>

          <button className="mt-auto bg-blue-600 text-white py-2 rounded-xl font-semibold hover:bg-blue-700 transition">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
