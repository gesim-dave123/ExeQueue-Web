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
import React, { useState } from 'react';

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

const showTotalTooltip = (data) => (
  <div style={tooltipStyle}>
    <p style={{ margin: 2, fontWeight: 600 }}>Total: {data.total}</p>
  </div>
);

const showPriorityTooltip = (data) => (
  <div style={tooltipStyle}>
    <p style={{ margin: 0, fontWeight: 600 }}>Priority: {data.priority}</p>
  </div>
);

const showRegularTooltip = (data) => (
  <div style={tooltipStyle}>
    <p style={{ margin: 0, fontWeight: 600 }}>Regular: {data.regular}</p>
  </div>
);

const tooltipStyle = {
  backgroundColor: 'rgba(32, 33, 36, 0.70)', // 29% opacity
  borderRadius: '8px',
  padding: '5px 12px',
  color: 'white',
  fontSize: '13px',
};


const CustomCursor = ({ x, width, viewBox }) => {
  const chartHeight = viewBox?.height || 0;

  return (
    <rect
      x={x}
      y={0}
      width={width}
      height={chartHeight}
      fill="rgba(156, 163, 175, 0.3)"
      rx={8}
      style={{ pointerEvents: 'none' }}
    />
  );
};

const BarGraph = ({ chartData, onDayClick, selectedDay }) => {
  const [hoveredType, setHoveredType] = useState(null);

  const [hoveredDay, setHoveredDay] = useState(null);

  const handleDayClick = (day) => {
    if (onDayClick) {
      // If clicking the same day, deselect it
      if (selectedDay === day) {
        onDayClick(null);
      } else {
        onDayClick(day);
      }
    }
  };
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    if (hoveredType === "total") return showTotalTooltip(data);
    if (hoveredType === "priority") return showPriorityTooltip(data);
    if (hoveredType === "regular") return showRegularTooltip(data);
  }
  return null;
};


  // Function to determine bar color based on hover
  const getBarColor = (day, defaultColor) => {
    if (!hoveredDay === day) {
      return '#9CA3AF'; // gray-400
    }
    return defaultColor;
  };

  // Keep opacity logic for selection
  const getBarOpacity = (day) => {
    if (selectedDay) return selectedDay === day ? 1 : 0.4;
    return 1;
  };
  //  const getBarHeight = (value, chartHeight) => {
  //   return (value / maxValue) * chartHeight;
  // };

  return (
    <div className="w-full" style={{ outline: 'none' }} tabIndex={-1}>
      <div className="w-full h-[250px] sm:h-[280px] md:h-[315px] relative no-outline" style={{ outline: 'none' }}>
        <ResponsiveContainer width="100%" height="100%"   style={{ outline: 'none' }}>
          <BarChart
            data={chartData}
            barGap="8%"
            barCategoryGap="25%"
            margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
            style={{ cursor: 'pointer' }}  // Add this line
            onMouseMove={(state) => {
              if (state?.activeLabel) {
                setHoveredDay(state.activeLabel);
              }
            }}
            onMouseLeave={() => setHoveredDay(null)}
            onClick={(state) => {
              if (state?.activeLabel) {
                handleDayClick(state.activeLabel);
              }
            }}
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
              tick={{ fontSize: 12, cursor: 'pointer' }}
              className="text-xs sm:text-sm"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[0, 1500]}
              ticks={[0, 500, 1000, 1500]}
              tick={{ fontSize: 12 }}
              className="text-xs sm:text-sm"
              width={50}
            />

           {hoveredType === "total" ? (
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }}
                isAnimationActive={false}
                offset={-80}  // Offset only for total bar
              />
            ) 
            : hoveredType === "priority" ? (
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }}
                isAnimationActive={false}
                offset={-47} 
              />
            ) 
              
            : (
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }}
                isAnimationActive={false}
                offset={-15}  
              />
            )}

            {/* Total Bar with gray hover effect */}
            <Bar
              dataKey="total"
              name="Total"
              radius={[8, 8, 0, 0]}
              maxBarSize={50}
              onMouseOver={() => setHoveredType("total")}
              onMouseOut={() => setHoveredType(null)}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-total-${index}`} 
                  fill={getBarColor(entry.day, '#10458B')}
                  opacity={getBarOpacity(entry.day)}
                />
              ))}
            </Bar>
            
            {/* Priority Bar with gray hover effect */}
            <Bar
              dataKey="priority"
              name="Priority"
              radius={[8, 8, 0, 0]}
              maxBarSize={50}
              onMouseOver={() => setHoveredType("priority")}
              onMouseOut={() => setHoveredType(null)}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-priority-${index}`} 
                  fill={getBarColor(entry.day, '#FDE5B0')}
                  opacity={getBarOpacity(entry.day)}
                />
              ))}
            </Bar>
            {/* Regular Bar with gray hover effect */}
            <Bar
              dataKey="regular"
              name="Regular"
              radius={[8, 8, 0, 0]}
              maxBarSize={50}
              onMouseOver={() => setHoveredType("regular")}
              onMouseOut={() => setHoveredType(null)}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-regular-${index}`} 
                  fill={getBarColor(entry.day, '#1A73E8')}
                  opacity={getBarOpacity(entry.day)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 xs:gap-10 sm:gap-15 md:gap-20 mt-3 sm:mt-4 px-2">
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

      {/* Selected day display */}
      {selectedDay && (
        <div className="text-center mt-4">
          {/* <p className="text-sm text-blue-600 font-medium">
            Showing data for {selectedDay} • Click chart to change or{' '}
            <button
              onClick={() => onDayClick(null)}
              className="underline hover:text-blue-800"
            >
              reset
            </button>
          </p> */}
        </div>
      )}
    </div>
  );
};

export default BarGraph;