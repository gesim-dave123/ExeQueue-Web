import React, { useState } from 'react';
import { Calendar, User, Star, FileText, File } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DoughnutChart from '../../components/graphs/DoughnutChart'
import BarGraph from '../../components/graphs/BarGraph';

export default function Analytics() {
  const [view, setView] = useState('week'); // 'today' or 'week'
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'donut'

  const weekData = [
    { day: 'MON', total: 900, priority: 120, regular: 930 },
    { day: 'TUE', total: 100, priority: 150, regular: 950 },
    { day: 'WED', total: 180, priority: 50, regular: 130 },
    { day: 'THU', total: 1250, priority: 900, regular: 110 },
    { day: 'FRI', total: 720, priority: 300, regular: 690 },
    { day: 'SAT', total: 280, priority: 80, regular: 200 },
  ];

  const todayData = [
    { day: 'MON', total: 950, priority: 100, regular: 850 },
    { day: 'TUE', total: 200, priority: 60, regular: 140 },
    { day: 'WED', total: 750, priority: 90, regular: 660 },
    { day: 'THU', total: 480, priority: 120, regular: 360 },
    { day: 'FRI', total: 350, priority: 80, regular: 270 },
    { day: 'SAT', total: 100, priority: 30, regular: 70 },
  ];

  const weekRequests = [
    { icon: <img src="/assets/analytics/goodmoral.png" alt="" />, label: 'Good Moral Certificate', count: 145 },
    { icon: <img src="/assets/analytics/insurancepay.png" alt="" />, label: 'Insurance Payment', count: 120 },
    { icon: <img src="/assets/analytics/transmittal.png" alt="" />, label: 'Transmittal Letter', count: 134 },
    { icon: <img src="/assets/analytics/gatepass.png" alt="" />, label: 'Temporary Gate Pass', count: 95 },
    { icon: <img src="/assets/analytics/uniform.png" alt="" />, label: 'Uniform Exemption', count: 160 },
    { icon: <img src="/assets/analytics/enrollment.png" alt="" />, label: 'Enrollment/Transfer', count: 180}
  ];

  const todayRequests = [
    { icon: <img src="/assets/analytics/goodmoral.png" alt="" className="w-6 h-6" />, label: 'Good Moral Certificate', count: 32 },
    { icon: <img src="/assets/analytics/insurancepay.png" alt=""className="w-6 h-6"/>, label: 'Insurance Payment', count: 24 },
    { icon: <img src="/assets/analytics/transmittal.png" alt="" className="w-6 h-6"/>, label: 'Transmittal Letter', count: 28 },
    { icon: <img src="/assets/analytics/gatepass.png" alt="" className="w-6 h-6"/>, label: 'Temporary Gate Pass', count: 21 },
    { icon: <img src="/assets/analytics/uniform.png" alt="" className="w-6 h-6"/>, label: 'Uniform Exemption', count: 35 },
    { icon: <img src="/assets/analytics/enrollment.png" alt="" className="w-6 h-6"/>, label: 'Enrollment/Transfer', count: 40 }
  ];
  const today = () => {
    setView('today');
    setChartType('donut');

    
  }
  const week = () => {
    setView('week');
    setChartType('bar');
    
  }

  // const donutData = [
  //   { name: 'Regular', value: 66.7, color: '#3b82f6' },
  //   { name: 'Priority', value: 15.5, color: '#fbbf24' },
  //   { name: 'In Progress', value: 17.8, color: '#d1d5db' }
  // ];

  const chartData = view === 'week' ? weekData : todayData;
  const requests = view === 'week' ? weekRequests : todayRequests;

  return (
    <div className="min-h-screen bg-transparent  p-6">
      <div className="w-full b min-h-[80vh] mx-auto pl-5">
        {/* Header */}
        <div className="mb-8 pt-10">
          <h1 className="text-3xl text-left font-semibold text-[#202124]">Analytics</h1>
          <p className="text-left text-[#686969] mt-1">Insights and Performance Metrics</p>
        </div>

        {/* Top Stats Cards */}
        {/* Stats Grid */}
        <div className="flex  gap-6 mb-6">
          {/* Card 1 */}
          <div className="bg-white flex-2 rounded-xl shadow-xs p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-[#F5F5F5] p-2 rounded-xl">
                <img src="/assets/Monitor.png" alt="" />
              </div>
              <h3 className="text-base md:text-lg font-medium text-[#202124]">
                Today's Queue
              </h3>
            </div>
            <div className='flex justify-evenly gap-7 px-4'>
                <div className='border border-[#E2E3E4] rounded-2xl justify-between px-5 py-7 flex items-center gap-5  flex-1'>
                    <div>
                      <p className="text-md md:text-md font-medium text-[#202124] ">
                      Completed
                      </p>
                    </div>
                    <div>
                      <span className='text-[#1A73E8] font-semibold text-5xl'>180</span>
                    </div>
                </div>
                <div className='border border-[#E2E3E4] rounded-2xl justify-between px-5 py-7 flex items-center gap-5 flex-1'>
                    <div>
                      <p className="text-md md:text-md font-medium text-[#202124] ">
                      In Progress
                      </p>
                    </div>
                    <div>
                      <span className='text-[#1A73E8] font-semibold text-5xl'>33</span>
                    </div>
                </div>
            </div>
            
            
           
          </div>

          {/* Card 3 */}
          <div className="bg-white flex-1 rounded-xl shadow-xs p-5 flex flex-col justify-between">
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
          <div className="bg-white flex-1 rounded-xl shadow-xs p-5 flex flex-col justify-between">
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

           <div className="flex gap-2 justify-end mb-5">
            <div className='bg-white p-2 rounded-xl'>
                <button
                  onClick={() => today()}
                  className={`px-4 py-2 mr-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    view === 'today'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => week()}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    view === 'week'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  This Week
                </button>
                
            </div>
               
          </div>

        {/* Bottom Section */}
        <div className="flex gap-6">
          {/* Queue Summary */}
          <div className="lg:col-span-2 flex flex-1 bg-white rounded-xl shadow-xs p-6 gap-5">
            <div className='flex-3 '>
              <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="bg-[#F5F5F5] p-2 rounded-xl">
                <img src="/assets/analytics/summary.png" alt="" />
                </div>
                <h3 className="font-semibold text-gray-700">Queue Summary</h3>
              </div>
              <div className="flex gap-2">
                {/* <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 rounded text-sm ${
                    chartType === 'bar' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
                  }`}
                >
                  Bar
                </button>
                <button
                  onClick={() => setChartType('donut')}
                  className={`px-3 py-1 rounded text-sm ${
                    chartType === 'donut' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
                  }`}
                >
                  Donut
                </button> */}
              </div>
            </div>

            {chartType === 'bar' ? (
              <>
                  <BarGraph chartData={chartData} />
                {/* <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-900"></div>
                    <span className="text-sm text-gray-600">Total</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <span className="text-sm text-gray-600">Priority</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-600">Regular</span>
                  </div>
                </div> */}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[350px]">

               <DoughnutChart/>

                <div className="flex items-center justify-center gap-6 mt-8">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <span className="text-sm text-gray-600">Priority <span className="font-semibold">15.5%</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-600">Regular <span className="font-semibold">66.7%</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                    <span className="text-sm text-gray-600">In Progress <span className="font-semibold">17.8%</span></span>
                  </div>
                </div>
              </div>
            )}
            </div>
            
             {/* Request Breakdown */}
            <div className="bg-white  flex-1 flex flex-col border-l border-[#E2E3E4] px-6  ">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-[#F5F5F5] p-2 rounded-xl">
                <img src="/assets/analytics/breakdown.png" alt="" />
              </div>
                <h3 className="font-semibold text-gray-700">Request Breakdown</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">Number of Completed Requests</p>
              
              <div className="space-y-4 ">
                {requests.map((request, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{request.icon}</span>
                      <span className="text-sm text-gray-700">{request.label}</span>
                    </div>
                    <span className="font-bold text-gray-900">{request.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

         
        </div>
      </div>
    </div>
  );
}