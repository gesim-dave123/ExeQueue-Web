import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import ConfirmModal from "../../components/modal/ConfirmModal";

export default function SearchQueue() {
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Fake function to "validate" queue number
  // Replace with your API call or actual validation logic
  const checkQueue = () => {
    if (!query || query.trim() === "" || query !== "12345") {
      // If queue not found
      window.location.href = "/student/search-queue-result";
      // setShowModal(true);
    } else {
      // If queue found, redirect (example: homepage or another page)
      window.location.href = "/student/display-queue"; // replace with actual page
    }
  };

  return (
    <div className="min-h-[90vh] w-full flex justify-center items-center flex-col px-4 py-6">
      {/* Title and instruction */}
      <div className="w-full max-w-lg flex flex-col text-start mb-6 lg:mb-10 lg:ml-10 lg:pr-5">
        <h1 className="text-4xl sm:text-5xl font-bold text-blue-600 mb-2">
          Search Queue
        </h1>
        <span className=" text-sm sm:text-[17px] mt-2 mb-3">
          Please enter your <span className="text-[#1A73E8]">Student ID</span>{" "}
          or <span className="text-[#1A73E8]">Queue Reference Number</span> to
          view your queue ticket.
        </span>
      </div>

      {/* Input */}
      <div className="flex w-full max-w-xl rounded-full overflow-hidden border border-blue-600 bg-white focus-within:ring-2 focus-within:ring-blue-400 mb-10 sm:mb-15">
        {/* Input Field */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., 23785371 or 0019-142-323"
          className="flex-1 px-4 py-3 outline-none text-sm sm:text-bas bg-white placeholder-gray-400"
        />

        {/* Search Button / Icon */}
        <button
          onClick={checkQueue} // replace with your search function
          className="w-23 h-md bg-blue-600 flex items-center justify-center hover:bg-gray-400 transition-colors"
        >
          <img src="/assets/Search icon.png" alt="search" className="w-5 h-5" />
        </button>
      </div>

      {/* Button */}
      <div className="w-full max-w-xl flex justify-end">
        <button
          onClick={() => (window.location.href = "/")} // redirect homepage
          className="mt-6 mb-20 bg-blue-600 text-sm hover:bg-blue-700 text-white font-medium px-5 py-4 rounded-2xl flex items-center gap-2"
        >
          <ArrowLeft size={17} /> Back to Homepage
        </button>
      </div>

      {/* Modal */}
      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Queue Ticket Not Found"
        titleClassName="text-xl font-semibold text-gray-800 text-center mb-4"
        description={
          <>
            Make sure the Student ID or Queue Reference Number <br /> you
            entered is correct.
            <br />
            <br />
            If you do not have a queue ticket, <br /> please go back to the
            homepage and generate one.
          </>
        }
        descriptionClassName="text-gray-700 text-sm text-center px-3"
        hideActions={true} // 🔹 only X button shows
        overlayClickClose={false} // optional: only X can close
      />
    </div>
  );
}
