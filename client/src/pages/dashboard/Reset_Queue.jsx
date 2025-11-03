import React, { useState } from "react";
import ConfirmModal from "../../components/modal/ConfirmModal";

export default function Reset_Queue() {
  const [modalConfig, setModalConfig] = useState(null);

  // Modal configurations
  const modalConfigs = {
    priority: {
      title: "Are you sure?",
      description: (
        <>
          Resetting the Priority Queue will set the queue <br />
          number sequence back to one. This action <br />
          cannot be undone
          <br />
          <br />
          Are you sure you want to continue?
        </>
      ),
      onConfirm: () => {
        console.log("Confirmed: Reset Priority Queue");
        handleCloseModal();
      },
    },
    regular: {
      title: "Are you sure?",
      description: (
        <>
          Resetting the Regular Queue will set the queue <br />
          number sequence back to one. This action <br />
          cannot be undone
          <br />
          <br />
          Are you sure you want to continue?
        </>
      ),
      onConfirm: () => {
        console.log("Confirmed: Reset Regular Queue");
        handleCloseModal();
      },
    },
    all: {
      title: "Are you sure?",
      description: (
        <>
          Resetting All Queue will set all queue <br />
          number sequence back to one. This action <br />
          cannot be undone
          <br />
          <br />
          Are you sure you want to continue?
        </>
      ),
      onConfirm: () => {
        console.log("Confirmed: Reset All Queues");
        handleCloseModal();
      },
    },
  };

  // Modal Functions
  const handleOpenModal = (type) => {
    setModalConfig(modalConfigs[type]);
  };

  const handleCloseModal = () => {
    setModalConfig(null);
  };

  return (
    <div className="min-h-screen flex items-start xl:items-center py-7 lg:py-20 xl:py-7 px-6 sm:px-10  xl:px-0 xl:pl-1 xl:pr-7">
      <div className="w-full h-full px-4 sm:px-5 lg:px-8 xl:px-10 flex flex-col items-start py-6 sm:py-12 lg:pt-8 lg:pb-17 xl:pt-9 xl:pb-23 bg-white rounded-2xl sm:rounded-3xl mt-12 lg:mt-0 shadow-xs">
        {/* Page Title */}
        <h1 className="flex gap-2 w-full text-2xl sm:text-3xl xl:text-4xl font-semibold pb-15">
          Reset Queue
        </h1>

        {/* Queue Reset Options */}
        <div className="flex flex-col justify-between gap-6 sm:gap-8 lg:gap-12 w-full">
          {/* Reset Priority Queue */}
          <div className="flex w-full items-start md:items-center flex-col md:flex-row justify-between gap-4 md:gap-6">
            <div className="w-full md:flex-1 flex flex-col items-start gap-3 sm:gap-4 md:gap-6">
              <h3 className="font-semibold text-lg sm:text-xl lg:text-2xl">
                Reset Priority Queue
              </h3>
              <span className="text-sm sm:text-base lg:text-xl text-left">
                Restart regular queue numbering from P-001 (keeps existing
                queues).
              </span>
            </div>
            <button
              className="w-full cursor-pointer md:w-auto md:min-w-[180px] lg:min-w-[200px] xl:min-w-[220px] bg-[#E2E3E4] py-3 px-4 sm:px-5 rounded-lg sm:rounded-xl text-[#EA4335] text-sm sm:text-base lg:text-lg font-semibold hover:bg-[#d0d1d2] transition-colors whitespace-nowrap flex-shrink-0"
              onClick={() => handleOpenModal("priority")}
            >
              Reset Priority Queue
            </button>
          </div>

          {/* Restart Regular Queue */}
          <div className="flex w-full items-start md:items-center flex-col md:flex-row justify-between gap-4 md:gap-6">
            <div className="w-full md:flex-1 flex flex-col items-start gap-3 sm:gap-4 md:gap-6">
              <h3 className="font-semibold text-lg sm:text-xl lg:text-2xl">
                Restart Regular Queue
              </h3>
              <span className="text-sm sm:text-base lg:text-xl text-left">
                Restart priority queue numbering from R-001 (keeps existing
                queues).
              </span>
            </div>
            <button
              className="w-full cursor-pointer md:w-auto md:min-w-[180px] lg:min-w-[200px] xl:min-w-[220px] bg-[#E2E3E4] py-3 px-4 sm:px-5 rounded-lg sm:rounded-xl text-[#EA4335] text-sm sm:text-base lg:text-lg font-semibold hover:bg-[#d0d1d2] transition-colors whitespace-nowrap flex-shrink-0"
              onClick={() => handleOpenModal("regular")}
            >
              Reset Regular Queue
            </button>
          </div>

          {/* Restart All Queues */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 lg:gap-8 w-full">
            <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 w-full md:flex-1">
              <h3 className="text-start font-semibold text-lg sm:text-xl lg:text-2xl">
                Restart All Queues
              </h3>
              <span className="text-sm sm:text-base lg:text-xl text-left leading-relaxed">
                End current session and start a new one; both queues restart
                from 001.
              </span>
            </div>

            <button
              className="w-full cursor-pointer md:w-auto md:min-w-[180px] lg:min-w-[190px] xl:min-w-[200px] bg-[#EA4335] text-white py-3 px-4 sm:px-5 rounded-xl text-base sm:text-lg font-semibold hover:bg-[#d32f2f] transition-colors whitespace-nowrap text-center flex-shrink-0"
              onClick={() => handleOpenModal("all")}
            >
              Reset All Queues
            </button>
          </div>
        </div>

        {/* Information Note */}
        <div className="w-full py-8 sm:py-10 lg:pt-30 lg:pb-0">
          <div className="bg-[#E8F1FD] w-full rounded-xl sm:rounded-2xl lg:rounded-3xl px-4 sm:px-5 py-6 sm:py-8 lg:py-10 flex justify-start">
            <span className="text-sm sm:text-base lg:text-xl text-left leading-relaxed">
              Note: The system will automatically close today's session after
              10:00PM and start a new one at 1:00 AM. The reset buttons only
              restart the numbering for today's session.
            </span>
          </div>
        </div>
      </div>

      {/* Single Confirmation Modal */}
      {modalConfig && (
        <ConfirmModal
          isOpen={true}
          onClose={handleCloseModal}
          onConfirm={modalConfig.onConfirm}
          icon="/assets/dashboard/system_settings_dropdown/reset_queue/caution_icon.png"
          iconAlt="Warning"
          iconSize="w-12 h-12"
          showLoading={true}
          title={modalConfig.title}
          cancelText="Cancel"
          confirmText="Confirm"
          showCloseButton={false}
          hideActions={false}
          cancelButtonClass="px-4 py-3 bg-[#EA4335] text-white hover:bg-red-700 rounded-xl w-1/2 font-medium cursor-pointer"
          confirmButtonClass="px-4 py-3 bg-[#E2E3E4] text-black hover:bg-[#c6c7c8] rounded-xl w-1/2 font-medium cursor-pointer"
          description={modalConfig.description}
        />
      )}
    </div>
  );
}
