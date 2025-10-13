// import { ArrowLeft, Camera, Clock } from "lucide-react";
// import { useState } from "react";
// import { Link } from "react-router-dom";

// export default function SearchQueueResult() {
//   const [query, setQuery] = useState("");

//   const checkQueue = () => {
//     if (!query || query.trim() === "" || query !== "12345") {
//       // If queue not found
//       setShowModal(true);
//     } else {
//       // If queue found, redirect (example: homepage or another page)
//       window.location.href = "/";
//     }
//   };

//   return (
//     <div className="min-h-[90vh] w-full flex justify-center items-center flex-col px-4 py-6 ">
//       <div className="flex w-full max-w-md rounded-full overflow-hidden border border-blue-600 bg-white focus-within:ring-2 focus-within:ring-blue-400 mb-15">
//         {/* Input Field */}
//         <input
//           type="text"
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           placeholder="Search Queue"
//           className="flex-1 px-4 py-3 outline-none text-sm sm:text-base font-normal bg-white placeholder-gray-500"
//         />

//         {/* Search Button / Icon */}
//         <button
//           onClick={checkQueue} // replace with your search function
//           className="w-18 h-md bg-blue-600 flex items-center justify-center hover:bg-gray-400 transition-colors"
//         >
//           <img src="/assets/Search icon.png" alt="search" className="w-5 h-5" />
//         </button>
//       </div>

//       {/* Note */}
//       <div className="w-full max-w-md border border-dashed bg-white border-blue-400 rounded-xl px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-4 text-blue-600 text-xs sm:text-sm md:text-base font-semibold mb-4 flex items-center justify-center gap-2">
//         <Camera size={18} className="flex-shrink-0" />
//         <span className="text-center">
//           Take a picture to keep note of your queue
//         </span>
//       </div>

//       {/* Main Card */}
//       <div className="w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col p-6 sm:p-8 items-center">
//         {/* Header */}
//         <div className="w-full flex justify-between items-center mb-6">
//           <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
//             Regular
//           </span>
//           <p className="text-xs text-gray-500">
//             Ref no.{" "}
//             <span className="text-blue-600 font-semibold">0019-112-232</span>
//           </p>
//         </div>

//         {/* Queue Number */}
//         <span className="text-xs font-medium text-gray-600 mb-2">
//           Your Queue Number
//         </span>
//         <h1 className="text-6xl sm:text-7xl font-bold text-blue-600 mb-2">
//           R001
//         </h1>

//         {/* Divider */}
//         <div className="w-full flex justify-center my-4">
//           <div className="w-full border-t-2 border-dashed border-gray-300"></div>
//         </div>

//         {/* Details */}
//         <div className="w-full space-y-4 text-sm">
//           <div className="flex justify-between">
//             <span className="text-gray-600">Name:</span>
//             <span className="text-blue-600 font-medium">Jan Lorenz Laroco</span>
//           </div>
//           <div className="flex justify-between">
//             <span className="text-gray-600">Student ID:</span>
//             <span className="text-blue-600 font-medium">23123457</span>
//           </div>
//           <div className="flex justify-between items-start">
//             <span className="text-gray-600">Requests:</span>
//             <div className="flex flex-col items-end text-blue-600 font-medium text-right space-y-1">
//               <span className="hover:underline cursor-pointer">
//                 Good Moral Certificate
//               </span>
//               <span className="hover:underline cursor-pointer">
//                 Insurance Payment
//               </span>
//               <span className="hover:underline cursor-pointer">
//                 Temporary Gate Pass
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Divider */}
//         <div className="w-full flex justify-center my-2">
//           <div className="w-full border-t-2 border-dashed border-gray-300 mt-4"></div>
//         </div>
//         {/* Issued Date */}
//         <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
//           <Clock size={15} />
//           <span>Issued on 2025-09-21 9:01 AM</span>
//         </div>
//       </div>

//       {/* Footer Button */}
//       <div className="w-full max-w-md flex justify-end">
//         <Link to="/" className="mt-10 mr-4">
//           <button className="mt-10   bg-blue-600 hover:bg-blue-700 text-white   text-sm font-medium px-4 py-4 rounded-xl flex items-center gap-2">
//             <ArrowLeft size={17} /> Back to Homepage
//           </button>
//         </Link>
//       </div>
//     </div>
//   );
// }

import { ArrowLeft, Camera, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import DateAndTimeFormatter, {
  FORMATS,
} from '../../../../server/utils/DateAndTimeFormatter';

export default function SearchQueueResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { queues, searchType, searchValue } = location.state || {};
  const [selectedQueueIndex, setSelectedQueueIndex] = useState(0);

  // Redirect back if no data
  useEffect(() => {
    if (!queues || queues.length === 0) {
      navigate('/student/queue/search');
    }
  }, [queues, navigate]);

  if (!queues || queues.length === 0) {
    return null;
  }

  const currentQueue = queues[selectedQueueIndex];

  // Format queue number with prefix
  const formatQueueNumber = (queueNumber, queueType) => {
    const prefix = queueType === 'PRIORITY' ? 'P' : 'R';
    return `${prefix}${String(queueNumber).padStart(3, '0')}`;
  };

  const formatYearLevel = (yearLevel) => {
    const yearMap = {
      1: 'First Year',
      2: 'Second Year',
      3: 'Third Year',
      4: 'Fourth Year',
      5: 'Fifth Year',
      '1st': 'First Year',
      '2nd': 'Second Year',
      '3rd': 'Third Year',
      '4th': 'Fourth Year',
      '5th': 'Fifth Year',
      first: 'First Year',
      second: 'Second Year',
      third: 'Third Year',
      fourth: 'Fourth Year',
      fifth: 'Fifth Year',
    };

    return yearMap[yearLevel?.toLowerCase()] || yearLevel;
  };

  return (
    <div className="min-h-[90vh] w-full flex justify-center items-center flex-col px-4 py-6">
      {/* Multiple Queue Navigation */}
      {queues.length > 1 && (
        <div className="w-full max-w-md mb-6 bg-white rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 mb-3 text-center">
            Found{' '}
            <span className="font-semibold text-blue-600">{queues.length}</span>{' '}
            queue(s) for{' '}
            {searchType === 'studentId' ? 'Student ID' : 'Reference Number'}:{' '}
            <span className="font-semibold">{searchValue}</span>
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {queues.map((queue, index) => (
              <button
                key={queue.queueId}
                onClick={() => setSelectedQueueIndex(index)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedQueueIndex === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {formatQueueNumber(queue.queueNumber, queue.queueType)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Note */}
      <div className="w-full max-w-md border border-dashed bg-white border-blue-400 rounded-xl px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-4 text-blue-600 text-xs sm:text-sm md:text-base font-semibold mb-4 flex items-center justify-center gap-2">
        <Camera size={18} className="flex-shrink-0" />
        <span className="text-center">
          Take a picture to keep note of your queue
        </span>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col p-6 sm:p-8 items-center">
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-6">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentQueue.queueType === 'PRIORITY'
                ? 'bg-[#FDE5B0] text-[#F9AB00]'
                : 'bg-blue-100 text-blue-600'
            }`}
          >
            {currentQueue.queueType === 'PRIORITY' ? 'Priority' : 'Regular'}
          </span>
          <p className="text-xs text-gray-500">
            Ref no.{' '}
            <span className="text-blue-600 font-semibold">
              {currentQueue.referenceNumber}
            </span>
          </p>
        </div>

        {/* Queue Number */}
        <span className="text-xs font-medium text-gray-600 mb-2">
          Your Queue Number
        </span>
        <h1
          className={`text-6xl sm:text-7xl font-bold mb-2 ${
            currentQueue.queueType === 'PRIORITY'
              ? 'text-[#F9AB00]'
              : 'text-blue-600'
          }`}
        >
          {formatQueueNumber(currentQueue.queueNumber, currentQueue.queueType)}
        </h1>

        {/* Divider */}
        <div className="w-full flex justify-center my-4">
          <div className="w-full border-t-2 border-dashed border-gray-300"></div>
        </div>

        {/* Details */}
        <div className="w-full space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Name:</span>
            <span className="text-blue-600 font-medium">
              {currentQueue.studentFullName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Student ID:</span>
            <span className="text-blue-600 font-medium">
              {currentQueue.studentId}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Course:</span>
            <span className="text-blue-600 font-medium">
              {currentQueue.courseCode}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Year Level:</span>
            <span className="text-blue-600 font-medium">
              {formatYearLevel(currentQueue.yearLevel)}
            </span>
          </div>

          {/* Requests */}
          {currentQueue.requests && currentQueue.requests.length > 0 && (
            <div className="flex justify-between items-start">
              <span className="text-gray-600">Requests:</span>
              <div className="flex flex-col items-end text-blue-600 font-medium text-right space-y-1">
                {currentQueue.requests.map((request) => (
                  <span
                    key={request.requestId}
                    className="hover:underline cursor-pointer"
                  >
                    {request.requestType.requestName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Window Assignment (if available) */}
          {currentQueue.serviceWindow && (
            <div className="flex justify-between">
              <span className="text-gray-600">Window:</span>
              <span className="text-blue-600 font-medium">
                {currentQueue.serviceWindow.windowName}
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-full flex justify-center my-2">
          <div className="w-full border-t-2 border-dashed border-gray-300 mt-4"></div>
        </div>

        {/* Issued Date */}
        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
          <Clock size={15} />
          <span>
            Issued on{' '}
            {DateAndTimeFormatter.formatInTimeZone(
              new Date(currentQueue.createdAt),
              FORMATS.DISPLAY
            )}
          </span>
        </div>
      </div>

      {/* Footer Button */}
      <div className="w-full max-w-md flex justify-end">
        <Link to="/" className="mt-10 mr-4">
          <button className="mt-10 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-4 rounded-xl flex items-center gap-2">
            <ArrowLeft size={17} /> Back to Homepage
          </button>
        </Link>
      </div>
    </div>
  );
}
