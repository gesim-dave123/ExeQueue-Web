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
import { motion } from "framer-motion";
import { ArrowLeft, Camera, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import DateAndTimeFormatter from "../../../../server/utils/DateAndTimeFormatter";
import { getQueueDisplay } from "../../api/student";

export default function DisplayQueue() {
  const navigate = useNavigate();
  const { queueId } = useParams();
  const location = useLocation();
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const referenceNumber = location.state?.referenceNumber || null;
  // Get ref from query string (/display?ref=xxxxx)
  const queryParams = new URLSearchParams(location.search);
  // const referenceNumber = queryParams.get("ref");

  useEffect(() => {
    const fetchQueueData = async () => {
      try {
        if (!queueId) {
          setError("No Queue Id provided.");
          setLoading(false);
          return;
        }
        const options =
          {
            referenceNumber: referenceNumber,
          } || undefined;
        const response = await getQueueDisplay(queueId, options);
        if (response?.success) {
          console.log("Queue: ", response);
          const payload = response.data ?? response;
          const details =
            payload.queueDetails ?? payload?.data?.queueDetails ?? payload;

          const normalized = payload.queueDetails ? payload : payload;
          setQueueData(payload.queueDetails ? payload.queueDetails : payload);

          console.log(
            "📦 Queue data from backend:",
            payload.queueDetails ?? payload
          );
        } else {
          setError(response?.message || "Queue not found.");
        }
      } catch (err) {
        console.error("Error fetching queue:", err);
        setError("Failed to fetch queue details.");
      } finally {
        setLoading(false);
      }
    };

    fetchQueueData();
  }, [queueId]);

  const yearLevelMap = {
    "1st": "First Year",
    "2nd": "Second Year",
    "3rd": "Third Year",
    "4th": "Fourth Year",
    "5th": "Fifth Year",
    "6th": "Sixth Year",
    Irregular: "Irregular",
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
        "yyyy-MM-dd hh:mm a"
      )
    : DateAndTimeFormatter.formatInTimeZone(new Date(), "yyyy-MM-dd hh:mm a");

  // 🎨 Color logic for queue type
  const isPriority = queueData?.queueType?.toLowerCase?.() === "priority";
  const typeColor = isPriority ? "text-[#F9AB00]" : "text-[#1A73E8]";
  const badgeBg = isPriority
    ? "bg-[#FDE5B0] text-[#F9AB00]"
    : "bg-[#DDEAFC] text-[#1A73E8]";

  return (
    <div className="min-h-[90vh] w-full flex justify-center items-center flex-col px-4 py-6">
      {/* Note */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md border border-dashed bg-white border-blue-400 rounded-xl px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-4 text-[#1A73E8] text-xs sm:text-sm md:text-base font-semibold mb-4 flex items-center justify-center gap-2"
      >
        <Camera size={18} className="flex-shrink-0" />
        <span className="text-center">
          Take a picture to keep note of your queue
        </span>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col p-6 sm:p-8 items-center"
      >
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-6">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${badgeBg} !normal-case`}
            style={{ textTransform: "none" }}
          >
            {(() => {
              const text = queueData?.queueType || "Regular";
              if (!text) return "";
              return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
            })()}
          </span>
          <p className="text-xs text-gray-500">
            Ref no.{` `}
            <span className="text-[#1456AE] font-semibold">
              {queueData?.referenceNumber ?? "N/A"}
            </span>
          </p>
        </div>

        {/* Queue Number */}
        <span className="text-xs font-medium text-gray-600 mb-2">
          Your Queue Number
        </span>
        <h1 className={`text-6xl sm:text-7xl font-bold ${typeColor} mb-2`}>
          {queueData?.formattedQueueNumber}
        </h1>
        {/* Divider */}
        <div className="w-full flex justify-center my-4">
          <div className="w-full border-t-2 border-dashed border-gray-300"></div>
        </div>

        {/* Details */}
        <div className="w-full space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Name:</span>
            <span className="text-[#1A73E8] font-semibold">
              {(() => {
                const name =
                  queueData?.studentFullName ?? queueData?.fullName ?? "N/A";
                return name
                  .toLowerCase()
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");
              })()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Student ID:</span>
            <span className="text-[#1A73E8] font-semibold">
              {queueData?.studentId ?? "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-gray-600">Requests:</span>
            <div className="flex flex-col items-end text-[#1A73E8] font-semibold text-right space-y-1">
              {queueData?.requests?.length ? (
                queueData.requests.map((req, idx) => (
                  <span key={idx}>
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
        <div className="text-xs text-[#686969] mt-1 font-medium flex items-center gap-2">
          <Clock size={15} />
          <span>Issued on {issuedAt}</span>
        </div>
      </motion.div>

      {/* Footer Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        className="w-full max-w-md flex justify-center"
      >
        <button
          onClick={() => navigate("/")}
          className="mt-10 w-full bg-[#1A73E8] hover:bg-[#1456AE] cursor-pointer text-white text-sm font-medium px-4 py-4 rounded-xl flex items-center justify-center gap-2"
        >
          <ArrowLeft size={17} /> Back to Homepage
        </button>
      </motion.div>
    </div>
  );
}
