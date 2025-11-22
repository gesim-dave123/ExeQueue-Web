import { useEffect, useState } from 'react';
import { SSE } from '../../api/sseApi';
import { fetchDashboardStatistics } from '../../api/statistics';
import DoughnutChart from '../../components/graphs/DoughnutChart';

// export default function Dashboard() {
//   const [activeTab, setActiveTab] = useState('Today');

//   const stats = {
//     total: 213,
//     categories: [
//       { name: 'Priority', percentage: 15.5, color: 'bg-[#FDE5B0]', count: 33 },
//       { name: 'Regular', percentage: 66.7, color: 'bg-[#1A73E8]', count: 142 },
//       {
//         name: 'In Progress',
//         percentage: 17.8,
//         color: 'bg-[#E2E3E4]',
//         count: 38,
//       },
//     ],
//   };

//   return (
//     <div className="min-h-screen py-15 xl:py-8 flex bg-transparent w-full ">
//       {/* Main Content */}
//       <div className="flex-1 pr-10 md:px-8 lg:px-12 transition-all duration-300 ease-in-out">
//         {/* Header */}
//         <div className="mb-6 mt-4 text-left">
//           <h2 className="text-2xl md:text-3xl font-semibold text-[#202124]">
//             Dashboard
//           </h2>
//           <span className="text-sm md:text-base text-[#686969]">
//             Your Queue Management Snapshot
//           </span>
//         </div>

//         {/* Stats Grid */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
//           {/* Card 1 */}
//           <div className="bg-white rounded-xl shadow-xs p-5 flex flex-col gap-3">
//             <div className="flex items-center gap-3">
//               <div className="bg-[#F5F5F5] p-2 rounded-xl">
//                 <img src="/assets/Monitor.png" alt="" />
//               </div>
//               <h3 className="text-base md:text-lg font-medium text-[#202124]">
//                 Window 1
//               </h3>
//             </div>
//             <p className="text-3xl md:text-5xl font-bold text-[#1A73E8] mt-7 xl:text-start ">
//               R001
//             </p>
//             <button className="bg-[#26BA33]/20 py-1 px-2 rounded-2xl text-[#26BA33] text-xs md:text-sm lg:text-md font-medium">
//               Currently Serving
//             </button>
//           </div>

//           {/* Card 2 */}
//           <div className="bg-white rounded-xl shadow-xs p-5 flex flex-col gap-3">
//             <div className="flex items-center gap-3">
//               <div className="bg-[#F5F5F5] p-2 rounded-xl">
//                 <img src="/assets/Monitor.png" alt="" />
//               </div>
//               <h3 className="text-base md:text-lg font-medium text-[#202124]">
//                 Window 2
//               </h3>
//             </div>
//             <p className="text-3xl md:text-5xl font-bold text-[#F9AB00] mt-7 xl:text-start">
//               P002
//             </p>
//             <button className="bg-[#26BA33]/20 py-1 px-2 rounded-2xl text-[#26BA33] text-xs md:text-sm lg:text-md font-medium">
//               Currently Serving
//             </button>
//           </div>

//           {/* Card 3 */}
//           <div className="bg-white rounded-xl shadow-xs p-5 flex flex-col justify-between">
//             <div className="flex items-center gap-3">
//               <div className="bg-[#F5F5F5] p-2 rounded-xl">
//                 <img src="/assets/person icon.png" alt="" />
//               </div>
//               <h3 className="text-base md:text-lg font-medium text-[#202124]">
//                 Total Regular
//               </h3>
//             </div>
//             <p className="text-4xl md:text-6xl font-semibold text-[#202124] xl:text-start">
//               142
//             </p>
//           </div>

//           {/* Card 4 */}
//           <div className="bg-white rounded-xl shadow-xs p-5 flex flex-col justify-between">
//             <div className="flex items-center gap-3">
//               <div className="bg-[#F5F5F5] p-2 rounded-xl">
//                 <img src="/assets/star icon.png" alt="" />
//               </div>
//               <h3 className="text-base md:text-lg font-medium text-[#202124]">
//                 Total Priority
//               </h3>
//             </div>
//             <p className="text-4xl md:text-6xl font-semibold text-[#202124] xl:text-start">
//               38
//             </p>
//           </div>
//         </div>

//         {/* Charts + Stats */}
//         <div className="flex flex-col xl:flex-row gap-6">
//           {/* Doughnut Chart Section */}
//           <div className="w-full xl:w-2/3 bg-white rounded-xl shadow-xs flex flex-col">
//             <div className="flex justify-between items-center w-full mb-4 p-5">
//               <div className="flex items-center gap-3">
//                 <div className="bg-[#F5F5F5] p-2 rounded-xl">
//                   <img src="/assets/queue summary.png" alt="" />
//                 </div>
//                 <h2 className="text-lg md:text-xl font-medium text-gray-800">
//                   Today's Queue Summary
//                 </h2>
//               </div>
//             </div>

//             <div className="flex flex-col items-center justify-center p-6">
//               <div className="w-28 sm:w-40 md:w-48 flex justify-center">
//                 <DoughnutChart />
//               </div>

//               {/* Legend */}
//               <div className="mt-6 flex flex-col sm:flex-row sm:justify-center gap-4">
//                 {stats.categories.map((category) => (
//                   <div
//                     key={category.name}
//                     className="flex items-center gap-2 text-sm"
//                   >
//                     <div
//                       className={`w-3 h-3 rounded-full ${category.color}`}
//                     ></div>
//                     <span className="text-gray-600">{category.name}</span>
//                     <span className="font-medium text-[#202124]">
//                       {category.percentage}%
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Today Stats */}
//           <div className="w-full xl:w-1/3 bg-white rounded-xl shadow-xs p-6 flex flex-col">
//             <div className="flex items-center gap-3">
//               <div className="bg-[#F5F5F5] p-2 rounded-xl">
//                 <img src="/assets/calendar icon.png" alt="" />
//               </div>
//               <span className="text-lg font-medium">Today</span>
//             </div>

//             <div className="flex flex-col mt-6 space-y-6">
//               <div className="flex flex-col h-full xl:h-[20vh] py-6 border border-gray-200 rounded-2xl text-center justify-center">
//                 <span className="font-medium">Completed</span>
//                 <span className="text-[#1A73E8] text-3xl md:text-6xl font-semibold">
//                   180
//                 </span>
//               </div>
//               <div className="flex flex-col h-full xl:h-[20vh]  py-6 border border-gray-200 rounded-2xl text-center justify-center">
//                 <span className="font-medium">In Progress</span>
//                 <span className="text-[#1A73E8] text-3xl md:text-6xl font-semibold">
//                   33
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// real live-data

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const getStats = async () => {
    try {
      const response = await fetchDashboardStatistics();

      if (response.success) {
        setStats(response.data);
        setErrorMsg('');
      } else {
        setErrorMsg(response.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setErrorMsg('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getStats();

    SSE.subscribe('statistics/dashboard', (data) => {
      if (data.type === 'dashboard-update') {
        console.log('Received Dashboard update:', data);
        getStats();
      }
    });

    return () => SSE.unsubscribe('statistics/dashboard');
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        Loading dashboard data...
      </div>
    );
  }

  if (errorMsg) {
    return <div className="p-6 text-center text-red-600">{errorMsg}</div>;
  }

  // Extract data safely
  const totals = stats?.totals || {};
  const backendWindows = stats?.windows || [];

  // Format windows - only show if IN_SERVICE
  const formattedWindows = (stats?.windows || []).map((window) => ({
    windowNo: window.windowNo,
    currentServing: {
      number: window.currentServing?.formattedQueueNumber || null,
      type:
        window.currentServing?.queueType === 'PRIORITY'
          ? 'Priority'
          : window.currentServing?.queueType === 'REGULAR'
          ? 'Regular'
          : null,
    },
  }));

  // Fallback-safe totals
  const totalQueueToday = totals.totalQueueToday || 0;
  const inProgress = totals.inProgress || 0;
  const completed = totals.completed || 0;
  const completedRegular = totals.completedRegular || 0;
  const completedPriority = totals.completedPriority || 0;

  return (
    <div className="min-h-screen py-15 xl:py-0 flex bg-transparent w-full">
      {/* Main Content */}
      <div className="flex-1 pb-5 pr-8 xl:pt-18 md:px-8 md:pl-15 xl:pl-9 transition-all duration-300 ease-in-out">
        {/* Header */}
        <div className="mb-6 text-left">
          <h2 className="text-3xl font-semibold text-[#202124]">Dashboard</h2>
          <span className="text-sm md:text-base text-[#686969]">
            Your Queue Management Snapshot
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          {/* Dynamic Window Cards */}
          {formattedWindows.map((win) => (
            <div
              key={win.windowNo}
              className="bg-white rounded-xl shadow-xs p-5 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="bg-[#F5F5F5] p-2 rounded-xl">
                  <img src="/assets/Monitor.png" alt="" />
                </div>
                <h3 className="text-base md:text-lg font-medium text-[#202124]">
                  Window {win.windowNo}
                </h3>
              </div>

              {/* Only show number if there's an active queue */}
              {win.currentServing.number ? (
                <>
                  <p
                    className={`text-3xl md:text-5xl font-bold mt-7 xl:text-start ${
                      win.currentServing.type === 'Priority'
                        ? 'text-[#F9A825]'
                        : 'text-[#1A73E8]'
                    }`}
                  >
                    {win.currentServing.number}
                  </p>
                  <div className="flex justify-start">
                    <span className="py-1 px-5 rounded-2xl text-xs md:text-sm lg:text-md font-medium bg-[#26BA33]/20 text-[#26BA33]">
                      Currently Serving
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-3xl md:text-5xl font-bold mt-7 xl:text-start text-transparent">
                    &nbsp;
                  </p>
                  <div className="flex justify-start">
                    <span className="py-1 px-5 rounded-2xl text-xs md:text-sm lg:text-md font-medium text-transparent">
                      &nbsp;
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Total Regular (Completed) */}
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
              {completedRegular}
            </p>
          </div>

          {/* Total Priority (Completed) */}
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
              {completedPriority}
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
                <DoughnutChart
                  totals={{
                    totalQueueToday: totals.totalQueueToday,
                    completedRegular: totals.completedRegular,
                    completedPriority: totals.completedPriority,
                    inProgress: totals.inProgress,
                  }}
                />
              </div>

              {/* Legend with Percentages */}
              <div className="mt-6 flex flex-col sm:flex-row sm:justify-center gap-4">
                {[
                  {
                    name: 'Regular',
                    color: 'bg-[#1A73E8]',
                    value: completedRegular,
                  },
                  {
                    name: 'Priority',
                    color: 'bg-[#FDE5B0]',
                    value: completedPriority,
                  },
                  {
                    name: 'In Progress',
                    color: 'bg-[#E2E3E4]',
                    value: inProgress,
                  },
                ].map((item) => {
                  const percentage =
                    totalQueueToday > 0
                      ? ((item.value / totalQueueToday) * 100).toFixed(1)
                      : '0.0';

                  return (
                    <div
                      key={item.name}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${item.color}`}
                      ></div>
                      <span className="text-gray-600">{item.name}</span>
                      <span className="font-medium text-[#202124]">
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
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
                  {completed}
                </span>
              </div>
              <div className="flex flex-col h-full xl:h-[20vh] py-6 border border-gray-200 rounded-2xl text-center justify-center">
                <span className="font-medium">In Progress</span>
                <span className="text-[#1A73E8] text-3xl md:text-6xl font-semibold">
                  {inProgress}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
