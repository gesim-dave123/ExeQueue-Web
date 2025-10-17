import React, { useState } from 'react'
import ConfirmModal from '../../components/modal/ConfirmModal'

export default function Reset_Queue() {
  const [showPriorityModal, setShowPriorityModal] = useState(false)
  const [showRegularModal, setShowRegularModal] = useState(false)
  const [showAllModal, setShowAllModal] = useState(false)

  // Priority Queue Modal Functions
  const handleOpenPriorityModal = () => {
    setShowPriorityModal(true)
  }

  const handleClosePriorityModal = () => {
    setShowPriorityModal(false)
  }

  const handleConfirmPriority = () => {
    console.log('Confirmed: Reset Priority Queue')
    handleClosePriorityModal()
  }

  // Regular Queue Modal Functions
  const handleOpenRegularModal = () => {
    setShowRegularModal(true)
  }

  const handleCloseRegularModal = () => {
    setShowRegularModal(false)
  }

  const handleConfirmRegular = () => {
    console.log('Confirmed: Reset Regular Queue')
    handleCloseRegularModal()
  }

  // All Queues Modal Functions
  const handleOpenAllModal = () => {
    setShowAllModal(true)
  }

  const handleCloseAllModal = () => {
    setShowAllModal(false)
  }

  const handleConfirmAll = () => {
    console.log('Confirmed: Reset All Queues')
    handleCloseAllModal()
  }

  return (
    <div className='w-full min-h-screen lg:h-screen bg-gray-250 py-7 px-3 xl:px-0 xl:pl-1 xl:pr-7'>
        <div className='w-full h-full px-7 flex flex-col items-start py-12 bg-white rounded-2xl'>
            <h1 className=' flex gap-2 w-full text-4xl font-semibold pb-10'>
                Reset Queue
            </h1>     
            <div className='flex flex-col justify-between gap-12 w-full'>
                <div className='flex w-full items-center flex-col md:flex-row justify-between gap-3'>
                    <div className='w-full flex justify-between flex-col items-start gap-6'>
                        <h3 className='font-semibold text-2xl'>
                            Reset Priority Queue
                        </h3>
                        <span className='text-xl text-left mb-3'>
                            Restart regular queue numbering from P-001 (keeps existing queues).
                        </span>
                    </div>
                    <button 
                      className='md:w-3xs w-full bg-[#E2E3E4] py-4 px-2 rounded-xl text-[#EA4335] text-lg font-semibold'
                      onClick={handleOpenPriorityModal}
                    >
                        Reset Priority Queue
                    </button>
                </div>
                <div className='flex w-full items-center flex-col md:flex-row justify-between gap-3'>
                    <div className='w-full flex justify-between flex-col items-start gap-6'>
                        <h3 className='font-semibold text-2xl'>
                            Restart Regular Queue
                        </h3>
                        <span className='text-xl text-left mb-3'>
                            Restart priority queue numbering from R-001 (keeps existing queues).
                        </span>
                    </div>
                    <button 
                      className='md:w-3xs w-full bg-[#E2E3E4] py-4 px-2 rounded-xl text-[#EA4335] text-lg font-semibold'
                      onClick={handleOpenRegularModal}
                    >
                        Reset Regular Queue
                    </button>
                </div>
                <div className='flex w-full items-center flex-col md:flex-row justify-between gap-3'>
                    <div className='w-full flex justify-between flex-col items-start gap-6'>
                        <h3 className='font-semibold text-2xl'>
                            Restart All Queues
                        </h3>
                        <span className='text-xl text-left mb-3'>
                            End current session and start a new one; both queues restart from  001.
                        </span>
                    </div>
                    <button 
                      className='md:w-[20vh] w-full bg-[#EA4335]  py-4 rounded-xl'
                      onClick={handleOpenAllModal}
                    >
                        <span className='text-white'>
                            Reset All Queues
                        </span>
                    </button>
                </div>
                
            </div> 

            <div className='w-full h-full py-20'>
                <div className='bg-[#E8F1FD] w-full rounded-3xl px-5 py-10 flex justify-start'>
                    <span className='text-xl flex justify-start text-left'>
                        Note: The system will automatically close today's session after 10:00PM and start a new one at 1:00 AM. The reset buttons only restart the numbering for today's session.
                    </span>
                </div>
            </div>
        </div>
        
        {/* Priority Queue Confirmation Modal */}
        <ConfirmModal
          isOpen={showPriorityModal}
          onClose={handleClosePriorityModal}
          onConfirm={handleConfirmPriority}
          icon="/assets/dashboard/system_settings_dropdown/reset_queue/caution_icon.png"
          iconAlt="Warning"
          iconSize="w-12 h-12"
          showLoading={true}
          title="Are you sure?"
          cancelText="Cancel"
          confirmText="Confirm"
          showCloseButton={false}
          hideActions={false}
          cancelButtonClass="px-4 py-3 bg-[#EA4335] text-white hover:bg-red-700 rounded-xl w-1/2 font-medium cursor-pointer"
          confirmButtonClass="px-4 py-3 bg-[#E2E3E4] text-black hover:bg-[#c6c7c8] rounded-xl w-1/2 font-medium cursor-pointer "
          description={
            <>
                Resetting the Priority Queue will set the queue <br />
                number sequence back to one. This action <br />
                cannot be undone
                <br />
                <br />
                Are you sure you want to continue?

            </>
          }
        />

        {/* Regular Queue Confirmation Modal */}
        <ConfirmModal
          isOpen={showRegularModal}
          onClose={handleCloseRegularModal}
          onConfirm={handleConfirmRegular}
          icon="/assets/dashboard/system_settings_dropdown/reset_queue/caution_icon.png"
          iconAlt="Warning"
          iconSize="w-12 h-12"
          showLoading={true}
          title="Are you sure?"
          cancelText="Cancel"
          confirmText="Confirm"
          showCloseButton={false}
          hideActions={false}
          cancelButtonClass="px-4 py-3 bg-[#EA4335] text-white hover:bg-red-700 rounded-xl w-1/2 font-medium cursor-pointer"
          confirmButtonClass="px-4 py-3 bg-[#E2E3E4] text-black hover:bg-[#c6c7c8] rounded-xl w-1/2 font-medium cursor-pointer "
          description={
            <>
                Resetting the Regular Queue will set the queue <br />
                number sequence back to one. This action <br />
                cannot be undone
                <br />
                <br />
                Are you sure you want to continue?

            </>
          }
        />

        {/* All Queues Confirmation Modal */}
        <ConfirmModal
          isOpen={showAllModal}
          onClose={handleCloseAllModal}
          onConfirm={handleConfirmAll}
          icon="/assets/dashboard/system_settings_dropdown/reset_queue/caution_icon.png"
          iconAlt="Warning"
          iconSize="w-12 h-12"
          showLoading={true}
          title="Are you sure?"
          cancelText="Cancel"
          confirmText="Confirm"
          showCloseButton={false}
          hideActions={false}
          cancelButtonClass="px-4 py-3 bg-[#EA4335] text-white hover:bg-red-700 rounded-xl w-1/2 font-medium cursor-pointer"
          confirmButtonClass="px-4 py-3 bg-[#E2E3E4] text-black hover:bg-[#c6c7c8] rounded-xl w-1/2 font-medium cursor-pointer "
          description={
            <>
                Resetting All Queue will set all queue <br />
                number sequence back to one. This action <br />
                cannot be undone
                <br />
                <br />
                Are you sure you want to continue?

            </>
          }
        />

    </div>
  )
}