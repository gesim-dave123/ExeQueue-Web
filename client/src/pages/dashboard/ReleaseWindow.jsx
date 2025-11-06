import { useState } from "react";
import { overrideWindowRelease } from "../../api/staff.api.js";
import ConfirmModal from "../../components/modal/ConfirmModal.jsx";

export default function ReleaseWindow() {
  const [showModal, setShowModal] = useState(false);
  const [selectedWindow, setSelectedWindow] = useState(null);

  const handleWindowRelease = async (windowNum) => {
    try {
      const result = await overrideWindowRelease(windowNum);
      if (!result) {
        throw new Error(result);
      }
      console.log("Result: ", result);
    } catch (error) {
      console.error(`Error in releaseing window number ${windowNum}: `, error);
    }
  };

  const handleRelease = (windowNumber) => {
    setSelectedWindow(windowNumber);
    setShowModal(true);
  };

  const confirmRelease = async () => {
    console.log("Selected Window: ", selectedWindow);
    await handleWindowRelease(selectedWindow);
    console.log(`Released Window ${selectedWindow}`);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen flex items-start xl:items-center py-19 xl:py-7 px-6 sm:px-10  xl:px-0 xl:pl-1 xl:pr-7">
      <div className="h-full w-full p-5 sm:p-8 lg:p-8 xl:pt-9 xl:p-10 bg-white rounded-2xl sm:rounded-3xl shadow-xs  lg:pb-[39vh] xl:pb-[56vh]">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl xl:text-4xl font-semibold mb-8 sm:mb-12 lg:mt-1 xl:mt-0 text-left">
          Release Window
        </h1>

        {/* Window 1 */}
        <div className="w-full flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
          {/* Info */}
          <div className="flex flex-col gap-3 sm:gap-5 text-left flex-1">
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
            className="bg-[#1A73E8] w-full md:w-auto min-w-[150px] text-sm sm:text-base lg:text-lg text-white font-medium px-4 sm:px-6 lg:px-4 py-2 sm:py-3 lg:py-3 rounded-lg sm:rounded-xl lg:rounded-2xl transition cursor-pointer duration-200 hover:bg-[#1669c1]"
          >
            Release Window 1
          </button>
        </div>

        {/* Window 2 */}
        <div className="w-full flex flex-col md:flex-row justify-between items-start gap-6">
          {/* Info */}
          <div className="flex flex-col gap-3 sm:gap-5 text-left flex-1">
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
            className="bg-[#1A73E8] w-full md:w-auto min-w-[150px] text-sm sm:text-base lg:text-lg text-white font-medium px-4 sm:px-6 lg:px-4 py-2 sm:py-3 lg:py-3  rounded-lg sm:rounded-xl lg:rounded-2xl transition duration-200 hover:bg-[#1669c1] cursor-pointer"
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
