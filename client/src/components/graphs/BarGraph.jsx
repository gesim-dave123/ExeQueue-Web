// import React from 'react';
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
// } from 'recharts';

// const CustomTooltip = ({ active, payload, coordinate }) => {
//   if (active && payload && payload.length) {
//     // Get the specific bar data
//     const barData = payload[0];

//     return (
//       <div
//         style={{
//           backgroundColor: '#20212499',
//           borderRadius: '8px',
//           boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
//           padding: '8px 12px',
//           // borderLeft: `4px solid ${barData.fill}`,
//         }}
//       >
//         {/* <p style={{ margin: 0, fontWeight: 600 }}>{barData.payload.day}</p> */}
//         <p style={{ margin: 0, color: 'white' }}>
//           {barData.name}: {barData.value}
//         </p>
//       </div>
//     );
//   }
//   return null;
// };

// const BarGraph = ({ chartData }) => {
//   return (
//     <>
//       <ResponsiveContainer width="100%" height={315}>
//         <BarChart data={chartData} barGap={25} barCategoryGap={20}>
//           <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#E2E3E4" />
//           <XAxis dataKey="day" axisLine={false} tickLine={false} />
//           <YAxis
//             axisLine={false}
//             tickLine={false}
//             domain={[0, 1500]}
//             ticks={[0,  500, 1000, 1500]}

//           />

//           <Tooltip
//             cursor={{ fill: 'rgba(0,0,0,0.05)' }}
//             content={<CustomTooltip />}
//             shared={false}
//             position={{  }}
//             isAnimationActive={false}
//             allowEscapeViewBox={{ x: false, y: true }}
//           />

//           {/* ✅ Each bar independently triggers tooltip */}
//           <Bar dataKey="total" name="Total" fill="#10458B" radius={[8, 8, 0, 0]} />
//           <Bar dataKey="priority" name="Priority" fill="#FDE5B0" radius={[8, 8, 0, 0]} />
//           <Bar dataKey="regular" name="Regular" fill="#1A73E8" radius={[8, 8, 0, 0]} />
//         </BarChart>
//       </ResponsiveContainer>

//       <div className="flex items-center justify-center gap-6 mt-4">
//         <div className="flex items-center gap-2">
//           <div className="w-3 h-3 rounded-full bg-[#10458B]"></div>
//           <span className="text-sm text-gray-600">Total</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="w-3 h-3 rounded-full bg-[#FDE5B0]"></div>
//           <span className="text-sm text-gray-600">Priority</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="w-3 h-3 rounded-full bg-[#1A73E8]"></div>
//           <span className="text-sm text-gray-600">Regular</span>
//         </div>
//       </div>
//     </>
//   );
// };

// export default BarGraph;

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const barData = payload[0];

    return (
      <div
        style={{
          backgroundColor: '#20212499',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          padding: '8px 12px',
        }}
      >
        <p style={{ margin: 0, color: 'white', fontSize: '14px' }}>
          {barData.name}: {barData.value}
        </p>
      </div>
    );
  }
  return null;
};

const CustomCursor = ({ x, width, y, height, viewBox }) => {
  const chartHeight = viewBox?.height || 0;

  return (
    <rect
      x={x}
      y={0}
      width={width}
      height={chartHeight}
      fill="rgba(26, 115, 232, 0.08)"
      stroke="rgba(26, 115, 232, 0.3)"
      strokeWidth={1}
      rx={8}
    />
  );
};

const BarGraph = ({ chartData }) => {
  return (
    <div className="w-full">
      {/* Responsive container with dynamic height */}
      <div className="w-full h-[250px] sm:h-[280px] md:h-[315px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            barGap={25} 
            barCategoryGap={20}
            margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="8 8"
              vertical={false}
              stroke="#E2E3E4"
            />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12 }}
              className="text-xs sm:text-sm"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[0, 1500]}
              ticks={[0, 500, 1000, 1500]}
              tick={{ fontSize: 12 }}
              className="text-xs sm:text-sm"
              width={40}
            />

            <Tooltip
              cursor={<CustomCursor />}
              content={<CustomTooltip />}
              shared={false}
              isAnimationActive={false}
              allowEscapeViewBox={{ x: false, y: true }}
            />

            <Bar
              dataKey="total"
              name="Total"
              fill="#10458B"
              radius={[8, 8, 0, 0]}
              maxBarSize={50}
            />
            <Bar
              dataKey="priority"
              name="Priority"
              fill="#FDE5B0"
              radius={[8, 8, 0, 0]}
              maxBarSize={50}
            />
            <Bar
              dataKey="regular"
              name="Regular"
              fill="#1A73E8"
              radius={[8, 8, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Responsive legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 mt-3 sm:mt-4 px-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#10458B] flex-shrink-0"></div>
          <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Total</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FDE5B0] flex-shrink-0"></div>
          <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Priority</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#1A73E8] flex-shrink-0"></div>
          <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Regular</span>
        </div>
      </div>
    </div>
  );
};

export default BarGraph;
