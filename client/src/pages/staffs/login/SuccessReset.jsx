// import { useEffect } from "react";
// import { useLocation, useNavigate } from "react-router-dom";

// export default function SuccessReset({ imageSrc, onLogin }) {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const message = location.state?.message;

//   useEffect(() => {
//     inputRefs[0].current?.focus();
//   }, [message]);

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
//       <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
//         {/* Image */}
//         <div className="flex justify-center mb-6">
//           {imageSrc ? (
//             <img
//               src="/assets/success.png"
//               alt="Password Reset Success"
//               className="w-64 h-48 object-contain"
//             />
//           ) : (
//             <div className="w-64 h-48  rounded-lg flex items-center justify-center">
//               <img src="/assets/success.png" alt="" className="w-96" />
//             </div>
//           )}
//         </div>

//         {/* Text Content */}
//         <div className="text-center mb-8">
//           <p className="text-gray-600 text-sm mb-2">
//             Your password has been reset
//           </p>
//           <h1 className="text-3xl font-semibold text-gray-900">Successfully</h1>
//         </div>

//         {/* Login Button */}
//         <button
//           onClick={() => navigate("/staff/login")}
//           className="w-full bg-[#1A73E8]  hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-2xl transition-colors duration-200 cursor-pointer"
//         >
//           Login
//         </button>
//       </div>
//     </div>
//   );
// }
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Loading from '../../../components/Loading';

export default function SuccessReset({ imageSrc }) {
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message;

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleLoginClick = () => {
    setIsLoading(true);
    setProgress(0);

    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            navigate('/staff/login');
          }, 500); // Small delay after reaching 100%
          return 100;
        }
        return prev + 10; // Increment by 10% every 200ms = 2 seconds total
      });
    }, 200);
  };

  return (
    <>
      <Loading text="Logging in..." progress={progress} isVisible={isLoading} />

      <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          {/* Image */}
          <div className="flex justify-center mb-6">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt="Password Reset Success"
                className="w-64 h-48 object-contain"
              />
            ) : (
              <div className="w-64 h-48 rounded-lg flex items-center justify-center">
                <img src="/assets/success.png" alt="Success" className="w-96" />
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className="text-center mb-8">
            <p className="text-gray-600 text-sm mb-2">
              Your password has been reset
            </p>
            <h1 className="text-3xl font-semibold text-gray-900">
              Successfully
            </h1>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLoginClick}
            disabled={isLoading}
            className={`w-full font-medium py-3 px-4 rounded-2xl transition-colors duration-200 ${
              isLoading
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-[#1A73E8] hover:bg-blue-700 text-white cursor-pointer'
            }`}
          >
            {isLoading ? 'Please wait...' : 'Login'}
          </button>
        </div>
      </div>
    </>
  );
}
