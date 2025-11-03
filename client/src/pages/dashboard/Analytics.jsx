import React, { useState, useEffect, useRef } from 'react';
import { Calendar, User, Star, FileText, File } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import DoughnutChart from '../../components/graphs/DoughnutChart';
import BarGraph from '../../components/graphs/BarGraph';
import backendConnection from '../../api/backendConnection';
import { getTodayAnalytics, getWeeklyAnalytics } from '../../api/statistics';
export default function Analytics() {
  const [view, setView] = useState('week');
  const [chartType, setChartType] = useState('bar');
  const [todayData, setTodayData] = useState(null);
  const [weekData, setWeekData] = useState(null);
  const [loading, setLoading] = useState(true);

  const viewRef = useRef(view);

  // Icon mapping for request types
  const iconMap = {
    'Good Moral Certificate': '/assets/analytics/goodmoral.png',
    'Insurance Payment': '/assets/analytics/insurancepay.png',
    'Transmittal Letter': '/assets/analytics/transmittal.png',
    'Temporary Gate Pass': '/assets/analytics/gatepass.png',
    'Uniform Exemption': '/assets/analytics/uniform.png',
    'Enrollment/Transfer': '/assets/analytics/enrollment.png',
  };

  // Fetch today's data
  const fetchTodayData = async () => {
    try {
      const result = await getTodayAnalytics();
      console.log('📊 Today analytics:', result);
      setTodayData(result.data);
    } catch (error) {
      console.error('Error fetching today analytics:', error);
    }
  };

  // Fetch weekly data
  const fetchWeeklyData = async () => {
    try {
      const result = await getWeeklyAnalytics();
      console.log('📊 Weekly analytics:', result);
      setWeekData(result.data);
    } catch (error) {
      console.error('Error fetching weekly analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  // Initial data fetch
  useEffect(() => {
    fetchTodayData();
    fetchWeeklyData();
  }, []);

  // SSE for today's live updates
  // ✅ SSE always connected, updates top cards on both views
  useEffect(() => {
    // Connect to SSE regardless of view
    const eventSource = new EventSource(
      `${backendConnection()}/api/statistics/dashboard/stream`,
      { withCredentials: true }
    );

    eventSource.onopen = () => {
      console.log('🟢 Analytics SSE connection opened');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📊 Analytics update received:', data);

        if (data.type === 'dashboard-update') {
          // ✅ ONLY refresh today's data (top cards)
          fetchTodayData();

          // ✅ Weekly data does NOT refresh here - only on button click
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('🔴 SSE error:', error);
    };

    // Cleanup on unmount only (not on view change)
    return () => {
      console.log('🔴 Closing Analytics SSE connection');
      eventSource.close();
    };
  }, []); // ✅ Empty dependency array - only mount/unmount

  const handleToday = () => {
    setView('today');
    setChartType('donut');
  };

  const handleWeek = () => {
    setView('week');
    setChartType('bar');

    // ✅ Refetch weekly data when switching to week view
    fetchWeeklyData();
  };

  // Transform weekly data for bar chart
  const transformWeekData = () => {
    if (!weekData?.queueSummary) return [];

    const dayMap = {
      Monday: 'MON',
      Tuesday: 'TUE',
      Wednesday: 'WED',
      Thursday: 'THU',
      Friday: 'FRI',
      Saturday: 'SAT',
    };

    return weekData.queueSummary.map((day) => ({
      day: dayMap[day.day] || day.day,
      total: day.totalQueues,
      priority: day.totalPriority,
      regular: day.totalRegular,
    }));
  };

  // Get chart data based on view
  const chartData = view === 'week' ? transformWeekData() : [];

  // Get request breakdown based on view
  const getRequests = () => {
    if (view === 'today' && todayData?.requestBreakdown) {
      return todayData.requestBreakdown.map((req) => ({
        icon: (
          <img
            src={iconMap[req.requestType] || '/assets/analytics/goodmoral.png'}
            alt=""
            className="w-6 h-6"
          />
        ),
        label: req.requestType,
        count: req.total,
      }));
    }

    if (view === 'week' && weekData?.weeklyRequestBreakdown) {
      return weekData.weeklyRequestBreakdown.map((req) => ({
        icon: (
          <img
            src={iconMap[req.requestType] || '/assets/analytics/goodmoral.png'}
            alt=""
          />
        ),
        label: req.requestType,
        count: req.total,
      }));
    }

    return [];
  };

  const requests = getRequests();

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Calculate doughnut data for today
  const doughnutTotals = todayData
    ? {
        totalQueueToday: todayData.totalQueues || 0,
        totalRegularWaiting: todayData.totalRegular || 0,
        totalPriorityWaiting: todayData.totalPriority || 0,
        inProgress: todayData.inProgress || 0,
      }
    : null;

  return (
    <div className="min-h-screen bg-transparent pr-6  md:pl-14 lg:pl-8 xl:pl-1 lg:py-4 md:pr-7 lg:pr-10">
      <div className="w-full min-h-[80vh] mx-auto pl-0 pr-1 lg:pl-5">
        {/* Header */}
        <div className="mb-8 pt-10">
          <h1 className="text-3xl text-left font-semibold text-[#202124]">
            Analytics
          </h1>
          <p className="text-left text-[#686969] mt-1">
            Insights and Performance Metrics
          </p>
        </div>

        {/* Top Stats Cards - Always show TODAY's data */}
        <div className="lg:flex gap-6 mb-6">
          {/* Card 1 - Today's Queue */}
          <div className="bg-white flex-2 rounded-xl shadow-xs p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-[#F5F5F5] p-2 rounded-xl">
                <img src="/assets/Monitor.png" alt="" />
              </div>
              <h3 className="text-base md:text-lg font-medium text-[#202124]">
                Today's Queue
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row justify-evenly gap-7 px-4">
              <div className="border border-[#E2E3E4] rounded-2xl justify-between px-5 py-7 flex items-center gap-5 flex-1">
                <div>
                  <p className="text-md md:text-md font-medium text-[#202124]">
                    Completed
                  </p>
                </div>
                <div>
                  <span className="text-[#1A73E8] font-semibold text-5xl">
                    {todayData?.completed || 0}
                  </span>
                </div>
              </div>
              <div className="border border-[#E2E3E4] rounded-2xl justify-between px-5 py-7 flex items-center gap-5 flex-1">
                <div>
                  <p className="text-md md:text-md font-medium text-[#202124]">
                    In Progress
                  </p>
                </div>
                <div>
                  <span className="text-[#1A73E8] font-semibold text-5xl">
                    {todayData?.inProgress || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row flex-2  gap-5 mt-7 sm:mt-7 md:mt-7 lg:mt-0 ">
        {/* Card 2 - Total Regular */}
                  <div className="bg-white flex-1 rounded-xl shadow-xs   p-5 flex flex-col justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#F5F5F5] p-2 rounded-xl">
                        <img src="/assets/person icon.png" alt="" />
                      </div>
                      <h3 className="text-base md:text-lg font-medium text-[#202124]">
                        Total Regular
                      </h3>
                    </div>
                    <p className="text-4xl pt-7 md:text-6xl font-semibold text-[#202124] lg:text-start">
                      {todayData?.totalRegular || 0}
                    </p>
                  </div>

                  {/* Card 3 - Total Priority */}
                  <div className="bg-white flex-1 rounded-xl shadow-xs p-5 flex flex-col justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#F5F5F5] p-2 rounded-xl">
                        <img src="/assets/star icon.png" alt="" />
                      </div>
                      <h3 className="text-base md:text-lg font-medium text-[#202124]">
                        Total Priority
                      </h3>
                    </div>
                    <p className="text-4xl pt-7 md:text-6xl font-semibold text-[#202124] lg:text-start">
                      {todayData?.totalPriority || 0}
                    </p>
                  </div>
          </div>
          
        </div>

        {/* View Toggle Buttons */}
        <div className="flex gap-2 justify-end mb-5">
          <div className="bg-white p-2 rounded-xl">
            <button
              onClick={handleToday}
              className={`px-4 py-2 mr-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                view === 'today'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={handleWeek}
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
        <div className="flex gap-6 mb-5">
          {/* Queue Summary */}
          <div className="lg:col-span-2 flex flex-1 flex-col lg:flex-row bg-white rounded-xl shadow-xs p-6 gap-5">
            <div className="flex-3">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="bg-[#F5F5F5] p-2 rounded-xl">
                    <img src="/assets/analytics/summary.png" alt="" />
                  </div>
                  <h3 className="font-semibold text-gray-700">Queue Summary</h3>
                </div>
              </div>

              {chartType === 'bar' ? (
                <BarGraph chartData={chartData} />
              ) : (
                <div className="flex flex-col items-center justify-center h-[350px]">
                  {doughnutTotals && <DoughnutChart totals={doughnutTotals} />}

                  <div className="flex items-center justify-center gap-6 mt-8">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <span className="text-sm text-gray-600">
                        Priority{' '}
                        <span className="font-semibold">
                          {doughnutTotals?.totalQueueToday > 0
                            ? (
                                (doughnutTotals.totalPriorityWaiting /
                                  doughnutTotals.totalQueueToday) *
                                100
                              ).toFixed(1)
                            : '0.0'}
                          %
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-gray-600">
                        Regular{' '}
                        <span className="font-semibold">
                          {doughnutTotals?.totalQueueToday > 0
                            ? (
                                (doughnutTotals.totalRegularWaiting /
                                  doughnutTotals.totalQueueToday) *
                                100
                              ).toFixed(1)
                            : '0.0'}
                          %
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                      <span className="text-sm text-gray-600">
                        In Progress{' '}
                        <span className="font-semibold">
                          {doughnutTotals?.totalQueueToday > 0
                            ? (
                                (doughnutTotals.inProgress /
                                  doughnutTotals.totalQueueToday) *
                                100
                              ).toFixed(1)
                            : '0.0'}
                          %
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Request Breakdown */}
            <div className="bg-white flex-1 flex flex-col mt-2  border-t lg:border-t-0 lg:border-l pl-0 lg:pl-4 border-[#E2E3E4] ">
              <div className="flex text-left items-center  mt-5 lg:mt-0 gap-2 mb-4">
                <div className="bg-[#F5F5F5] p-2 rounded-xl">
                  <img src="/assets/analytics/breakdown.png" alt="" />
                </div>
                <h3 className="font-semibold  text-gray-700">
                  Request Breakdown
                </h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Number of Completed Requests
              </p>

              <div className="space-y-4">
                {requests.length > 0 ? (
                  requests.map((request, index) => (
                    <div
                      key={index}
                      className="flex text-left items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{request.icon}</span>
                        <span className="text-sm text-gray-700">
                          {request.label}
                        </span>
                      </div>
                      <span className="font-bold text-gray-900">
                        {request.count}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No requests completed yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
