// import React from 'react';
// import {
//   Chart as ChartJS,
//   ArcElement,
//   Tooltip,
//   Legend
// } from 'chart.js';
// import { Doughnut } from 'react-chartjs-2';

// ChartJS.register(ArcElement, Tooltip, Legend);

// const DoughnutChart = ({
//   data,
//   className = '',
//   height = 300,
//   width = 300,
//   centerText = {
//     total: '213',
//     label: 'Total Queue'
//   },
//   emptyPercentage = 10
// }) => {
//   const defaultData = {
//     labels: ['Regular', 'Priority', 'In Progress', 'Empty'],
//     datasets: [
//       {
//         data: [66.7, 15.5, 17.8, emptyPercentage], // Add empty segment
//         backgroundColor: [
//           'rgba(26, 115, 232, 1)',     // #1A73E8 - Regular (now first)
//           'rgba(253, 229, 176, 1)',    // #FDE5B0 - Priority (now second)
//           'rgba(226, 227, 228, 1)',    // In Progress
//           'transparent',                // Empty space - transparent
//         ],
//         borderWidth: 2.5,
//         borderRadius: 10,
//         spacing: 12,
//           rotation: -165, // Start from top
//         circumference: 360,// Remove spacing for smooth empty segment
//       },
//     ],
//     ...data,
//   };

//   const options = {
//     responsive: true,
//     maintainAspectRatio: false,
//     cutout: '80%',
//      rotation: -90, // Start from top
//     circumference: 360,
//     plugins: {
//       legend: {
//         display: false,
//       },
//       tooltip: {
//         filter: (tooltipItem) => {
//           // Hide tooltip for empty segment
//           return tooltipItem.datasetIndex === 0 && tooltipItem.dataIndex !== 3;
//         },
//         callbacks: {
//           label: function(context) {
//             if (context.dataIndex === 3) return null; // Hide empty segment label
//             return `${context.label}: ${context.parsed}%`;
//           }
//         }
//       },
//     },
//   };

//   return (
//     <div
//       className={`relative ${className}`}
//       style={{
//         height: `${height}px`,
//         width: `${width}px`
//       }}
//     >
//       <Doughnut data={defaultData} options={options} />

//       <div className="absolute inset-0 flex flex-col items-center justify-center">
//         <div className="text-center ">
//            <div className="text-sm md:text-base text-gray-500">
//             {centerText.label}
//           </div>
//           <div className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
//             {centerText.total}
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// };

import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const DoughnutChart = ({
  totals = {},
  className = '',
  height = 300,
  width = 300,
}) => {
  // compute total and empty segment
  const totalAll = totals.totalQueueToday || 0 || 0;
  const sumActive =
    (totals.totalRegularWaiting || 0) +
    (totals.totalPriorityWaiting || 0) +
    (totals.inProgress || 0);
  const emptyPercentage = totalAll > 0 ? Math.max(0, totalAll - sumActive) : 0;

  const chartData = {
    labels: ['Regular', 'Priority', 'In Progress', 'Empty'],
    datasets: [
      {
        data: [
          totals.totalRegularWaiting || 0,
          totals.totalPriorityWaiting || 0,
          totals.inProgress || 0,
          emptyPercentage,
        ],
        backgroundColor: [
          'rgba(26, 115, 232, 1)', // Regular
          'rgba(253, 229, 176, 1)', // Priority
          'rgba(226, 227, 228, 1)', // In Progress
          'transparent', // Empty
        ],
        borderWidth: 2.5,
        borderRadius: 10,
        spacing: 12,
        rotation: -165,
        circumference: 360,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '80%',
    rotation: -90,
    circumference: 360,
    plugins: {
      legend: { display: false },
      tooltip: {
        filter: (tooltipItem) => tooltipItem.dataIndex !== 3,
        callbacks: {
          label: function (context) {
            if (context.dataIndex === 3) return null;
            return `${context.label}: ${context.parsed}`;
          },
        },
      },
    },
  };

  return (
    <div
      className={`relative ${className}`}
      style={{ height: `${height}px`, width: `${width}px` }}
    >
      <Doughnut data={chartData} options={options} />

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-sm md:text-base text-gray-500">Total Queue</div>
          <div className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            {totalAll}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoughnutChart;
