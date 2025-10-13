// import { useState } from "react";
// import { ArrowLeft, Camera, Clock } from "lucide-react";

// export default function DisplayQueue() {
//   return (
//     <div className="min-h-[90vh] w-full flex justify-center items-center flex-col px-4 py-6 ">
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
//       <div className="w-full max-w-md flex justify-center">
//         <button className="mt-10 w-full   bg-blue-600 hover:bg-blue-700 text-white   text-sm font-medium px-4 py-4 rounded-xl flex items-center justify-center gap-2">
//           <ArrowLeft size={17} /> Back to Homepage
//         </button>
//       </div>
//     </div>
//   );
// }
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DateAndTimeFormatter, {
  FORMATS,
} from '../../../../server/utils/DateAndTimeFormatter';
import { getQueueDisplay } from '../../api/student';
import { ArrowLeft, Camera, Clock } from 'lucide-react';

export default function DisplayQueue() {
  const navigate = useNavigate();
  const location = useLocation();
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get ref from query string (/display?ref=xxxxx)
  const queryParams = new URLSearchParams(location.search);
  const referenceNumber = queryParams.get('ref');

  useEffect(() => {
    const fetchQueueData = async () => {
      try {
        if (!referenceNumber) {
          setError('No reference number provided.');
          setLoading(false);
          return;
        }

        const response = await getQueueDisplay(referenceNumber);
        if (response?.success) {
          const payload = response.data ?? response;
          const details =
            payload.queueDetails ?? payload?.data?.queueDetails ?? payload;
          const normalized = payload.queueDetails ? payload : payload;
          setQueueData(payload.queueDetails ? payload.queueDetails : payload);

          console.log(
            '📦 Queue data from backend:',
            payload.queueDetails ?? payload
          );
        } else {
          setError(response?.message || 'Queue not found.');
        }
      } catch (err) {
        console.error('Error fetching queue:', err);
        setError('Failed to fetch queue details.');
      } finally {
        setLoading(false);
      }
    };

    fetchQueueData();
  }, [referenceNumber]);

  const yearLevelMap = {
    '1st': 'First Year',
    '2nd': 'Second Year',
    '3rd': 'Third Year',
    '4th': 'Fourth Year',
    '5th': 'Fifth Year',
  };

  if (loading)
    return (
      <div className="min-h-[90vh] flex justify-center items-center text-blue-600 font-medium">
        Loading queue details...
      </div>
    );

  if (error)
    return (
      <div className="min-h-[90vh] flex justify-center items-center text-red-600 font-medium">
        {error}
      </div>
    );

  // queueData should be the object with fields: queueNumber, formattedQueueNumber (optional), queueType, referenceNumber, fullName, studentId, courseCode, yearLevel, serviceRequests (array), createdAt
  const issuedAt = queueData?.createdAt
    ? DateAndTimeFormatter.formatInTimeZone(
        new Date(queueData.createdAt),
        FORMATS.DISPLAY
      )
    : DateAndTimeFormatter.formatInTimeZone(new Date(), FORMATS.DISPLAY);

  // 🎨 Color logic for queue type
  const isPriority = queueData?.queueType?.toLowerCase?.() === 'priority';
  const typeColor = isPriority ? 'text-[#F9AB00]' : 'text-blue-600';
  const badgeBg = isPriority
    ? 'bg-[#FDE5B0] text-[#F9AB00]'
    : 'bg-blue-100 text-blue-600';

  return (
    <div className="min-h-[90vh] w-full flex justify-center items-center flex-col px-4 py-6">
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
            className={`px-3 py-1 rounded-full text-sm font-medium ${badgeBg}`}
          >
            {queueData?.queueType || 'Regular'}
          </span>
          <p className="text-xs text-gray-500">
            Ref no.{` `}
            <span className="text-blue-600 font-semibold">
              {queueData?.referenceNumber ?? 'N/A'}
            </span>
          </p>
        </div>

        {/* Queue Number */}
        <span className="text-xs font-medium text-gray-600 mb-2">
          Your Queue Number
        </span>
        <h1 className={`text-6xl sm:text-7xl font-bold ${typeColor} mb-2`}>
          {queueData?.formattedQueueNumber
            ? isPriority
              ? `P${queueData.formattedQueueNumber}`
              : `R${queueData.formattedQueueNumber}`
            : isPriority
            ? `P${String(queueData?.queueNumber ?? '').padStart(2, '0')}`
            : `R${String(queueData?.queueNumber ?? '').padStart(2, '0')}`}
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
              {queueData?.studentFullName ?? queueData?.fullName ?? 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Student ID:</span>
            <span className="text-blue-600 font-medium">
              {queueData?.studentId ?? 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Course:</span>
            <span className="text-blue-600 font-medium">
              {queueData?.courseCode ?? queueData?.courseName ?? 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Year Level:</span>
            <span className="text-blue-600 font-medium">
              {yearLevelMap[queueData?.yearLevel] ??
                queueData?.yearLevel ??
                'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-gray-600">Requests:</span>
            <div className="flex flex-col items-end text-blue-600 font-medium text-right space-y-1">
              {queueData?.serviceRequests?.length ? (
                queueData.serviceRequests.map((req, idx) => (
                  <span key={idx} className="hover:underline cursor-pointer">
                    {req.requestName ?? req.requestType?.requestName}
                  </span>
                ))
              ) : (
                <span>No Requests</span>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full flex justify-center my-2">
          <div className="w-full border-t-2 border-dashed border-gray-300 mt-4"></div>
        </div>

        {/* Issued Date */}
        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
          <Clock size={15} />
          <span>Issued on {issuedAt}</span>
        </div>
      </div>

      {/* Footer Button */}
      <div className="w-full max-w-md flex justify-center">
        <button
          onClick={() => navigate('/')}
          className="mt-10 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-4 rounded-xl flex items-center justify-center gap-2"
        >
          <ArrowLeft size={17} /> Back to Homepage
        </button>
      </div>
    </div>
  );
}
