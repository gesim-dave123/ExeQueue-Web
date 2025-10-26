import React, { useState } from "react";
import ConfirmModal from "../../components/modal/ConfirmModal.jsx";

export default function ReleaseWindow() {
  const [showModal, setShowModal] = useState(false);
  const [selectedWindow, setSelectedWindow] = useState(null);

  const handleRelease = (windowNumber) => {
    setSelectedWindow(windowNumber);
    setShowModal(true);
  };

  const confirmRelease = () => {
    console.log(`Released Window ${selectedWindow}`);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen flex items-center py-7 px-3 xl:px-0 xl:pl-1 xl:pr-7">
      <div className="h-full w-full p-5 sm:p-8 lg:p-10 bg-white rounded-2xl sm:rounded-3xl shadow-xs lg:pb-[55vh]">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-8 sm:mb-15  text-center lg:text-left">
          Release Window
        </h1>

        {/* Window 1 */}
        <div className="w-full flex flex-col lg:flex-row justify-between items-center lg:items-start gap-6 mb-10">
          {/* Info */}
          <div className="flex flex-col gap-3 sm:gap-5 text-center lg:text-left flex-1">
            <p className="text-xl sm:text-2xl lg:text-3xl font-medium">
              Release Window 1
            </p>
            <span className="text-sm sm:text-base lg:text-lg  leading-relaxed">
              Unassigned the personnel currently managing Window 1.
            </span>
          </div>

          {/* Button */}
          <button
            onClick={() => handleRelease(1)}
            className="bg-[#1A73E8] w-full sm:w-auto min-w-[150px] text-sm sm:text-base lg:text-lg text-white font-medium px-4 sm:px-6 lg:px-4 py-2 sm:py-3 lg:py-3 rounded-lg sm:rounded-xl lg:rounded-2xl transition duration-200 hover:bg-[#1669c1]"
          >
            Release Window 1
          </button>
        </div>

        {/* Window 2 */}
        <div className="w-full flex flex-col lg:flex-row justify-between items-center lg:items-start gap-6">
          {/* Info */}
          <div className="flex flex-col gap-3 sm:gap-5 text-center lg:text-left flex-1">
            <p className="text-xl sm:text-2xl lg:text-3xl font-medium">
              Release Window 2
            </p>
            <span className="text-sm sm:text-base lg:text-lg leading-relaxed">
              Unassigned the personnel currently managing Window 2.
            </span>
          </div>

          {/* Button */}
          <button
            onClick={() => handleRelease(2)}
            className="bg-[#1A73E8] w-full sm:w-auto min-w-[150px] text-sm sm:text-base lg:text-lg text-white font-medium px-4 sm:px-6 lg:px-4 py-2 sm:py-3 lg:py-3  rounded-lg sm:rounded-xl lg:rounded-2xl transition duration-200 hover:bg-[#1669c1]"
          >
            Release Window 2
          </button>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={confirmRelease}
        title="Confirm Release"
        descriptionClassName="text-gray-700 text-sm sm:text-base leading-relaxed text-center px-3 sm:px-5"
        description={
          <>
            Are you sure you want to release the personnel assigned to Window{" "}
            {selectedWindow}?
            <br />
            <br />
            This will immediately end their access to this window.
          </>
        }
        icon="/assets/Profile/Caution Icon.png"
        iconAlt="Release"
        confirmText="Confirm"
        cancelText="Cancel"
        showCloseButton={false}
      />
    </div>
  );
}
