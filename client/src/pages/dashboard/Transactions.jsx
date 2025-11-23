import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  getTransactionHistory,
  getTransactionStats,
} from "../../api/transaction.api";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({
    course: "",
    request: "",
    status: "",
    date: "",
  });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 8,
  });

  const [filterOptions, setFilterOptions] = useState({
    courses: [],
    requests: [],
    statuses: [],
  });

  const itemsPerPage = 8;

  const dropdownRefs = {
    course: useRef(null),
    request: useRef(null),
    status: useRef(null),
    date: useRef(null),
  };

  const formatStatusLabel = (status) => {
    const statusMap = {
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      STALLED: "Stalled",
      // PARTIALLY_COMPLETE: "Partially Complete",
    };
    return statusMap[status] || status;
  };

  const [gifError, setGifError] = useState(false);
  const loadingGifPath = "assets/loading_img.jpg";
  const LoadingIndicator = () => {
    if (!gifError) {
      return (
        <img
          src={loadingGifPath}
          alt="Loading..."
          className="h-12 w-12"
          onError={() => {
            console.warn("Loading GIF not found, falling back to spinner");
            setGifError(true);
          }}
        />
      );
    }

    return (
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    );
  };

  //REMOVED courseFull mapping - now showing just course codes

  // const fetchAPI = async (url, options = {}) => {
  //   try {
  //     const response = await fetch(url, {
  //       ...options,
  //       credentials: "include",
  //       headers: {
  //         "Content-Type": "application/json",
  //         ...options.headers,
  //       },
  //     });

  //     const contentType = response.headers.get("content-type");
  //     if (!contentType || !contentType.includes("application/json")) {
  //       console.error("Response is not JSON:", await response.text());
  //       throw new Error(
  //         "Server returned non-JSON response. Check if API endpoint exists."
  //       );
  //     }

  //     const data = await response.json();

  //     if (!response.ok) {
  //       throw new Error(data.message || `HTTP error ${response.status}`);
  //     }

  //     return data;
  //   } catch (error) {
  //     console.error("API Error:", error);
  //     throw error;
  //   }
  // };

  const fetchFilterOptions = async () => {
    try {
      const result = await getTransactionStats();
      if (!result) {
        throw new Error("Filter Options was null");
      }
      setFilterOptions(result);
    } catch (error) {
      console.error("Error fetching filter options:", error);
      setFilterOptions({
        courses: [],
        requests: [],
        statuses: [],
      });
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      console.log("Filters: ", filters);
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...filters,
      });

      if (searchQuery) {
        const normalizedSearch = searchQuery.trim().toUpperCase();
        const statusTerms = [
          "COMPLETED",
          "CANCELLED",
          "STALLED",
          "COMPLETE",
          "CANCEL",
          "STALL",
        ];
        const isStatusSearch = statusTerms.some(
          (term) => normalizedSearch === term || normalizedSearch.includes(term)
        );
        if (!isStatusSearch) {
          params.set("search", searchQuery);
        }
      }
      Object.keys(filters).forEach((key) => {
        if (!filters[key]) {
          params.delete(key);
        }
      });

      const result = await getTransactionHistory(params);

      console.log("✅ Transactions received:", result);
      if (result) {
        setTransactions(result.transactions);
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 8,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, filters, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        openDropdown &&
        dropdownRefs[openDropdown]?.current &&
        !dropdownRefs[openDropdown].current.contains(event.target)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  useEffect(() => {
    const detectStatusFromSearch = () => {
      if (searchQuery.trim()) {
        const normalizedSearch = searchQuery.trim().toUpperCase();

        const statusMap = {
          COMPLETED: "COMPLETED",
          CANCELLED: "CANCELLED",
          STALLED: "STALLED",
          COMPLETE: "COMPLETED",
          CANCEL: "CANCELLED",
          STALL: "STALLED",
        };

        const matchedStatus = statusMap[normalizedSearch];

        if (matchedStatus) {
          setFilters((prev) => ({ ...prev, status: matchedStatus }));
        }
      }
    };

    detectStatusFromSearch();
  }, [searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilters((prev) => ({ ...prev, status: "" }));
    } else {
      const normalizedSearch = searchQuery.trim().toUpperCase();
      const statusTerms = [
        "COMPLETED",
        "CANCELLED",
        "STALLED",
        "COMPLETE",
        "CANCEL",
        "STALL",
      ];

      const isStatusSearch = statusTerms.some(
        (term) => normalizedSearch === term || normalizedSearch.includes(term)
      );

      if (!isStatusSearch && filters.status) {
        setFilters((prev) => ({ ...prev, status: "" }));
      }
    }
  }, [searchQuery]);

const isStatusSearch = (query) => {
  if (!query.trim()) return false;
  
  const normalizedSearch = query.trim().toUpperCase();
  const statusTerms = [
    "COMPLETED", "CANCELLED", "STALLED", 
    "COMPLETE", "CANCEL", "STALL"
  ];
  
  return statusTerms.some(
    (term) => normalizedSearch === term || normalizedSearch.includes(term)
  );
};

const handleFilterChange = (filterType, value) => {
  setFilters((prev) => ({ ...prev, [filterType]: value }));
  setCurrentPage(1);
  setOpenDropdown(null);
  
  if (filterType === "status" && isStatusSearch(searchQuery)) {
    setSearchQuery("");
  }
};

  const clearFilters = () => {
    setFilters({ course: "", request: "", status: "", date: "" });
    setSearchQuery("");
    setSelectedDate(null);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "COMPLETED":
        return "text-[#26BA33]";
      case "STALLED":
        return "text-[#686969]";
      case "CANCELLED":
        return "text-[#EA4335]";
      case "DEFERRED":
        return "text-[#FFA500]";
      case "IN_SERVICE":
        return "text-[#1A73E8]";
      case "WAITING":
        return "text-[#686969]";
      case "SKIPPED":
        return "text-[#FFA500]";
      case "PARTIALLY_COMPLETE":
        return "text-[#FFA500]";
      default:
        return "text-blue-800";
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (pagination.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= pagination.totalPages; i++) pageNumbers.push(i);
    } else {
      pageNumbers.push(1);
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(pagination.totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        startPage = 2;
        endPage = 4;
      }
      if (currentPage >= pagination.totalPages - 2) {
        startPage = pagination.totalPages - 3;
        endPage = pagination.totalPages - 1;
      }

      if (startPage > 2) pageNumbers.push("...");
      for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
      if (endPage < pagination.totalPages - 1) pageNumbers.push("...");
      pageNumbers.push(pagination.totalPages);
    }
    return pageNumbers;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatDateDisplay = (date) => {
    if (!date) return "Date";
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sept",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${
      months[date.getMonth()]
    }. ${date.getDate()}, ${date.getFullYear()}`;
  };

  const handleDateSelect = (day) => {
    const selected = new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth(),
      day
    );
    setSelectedDate(selected);

    const year = selected.getFullYear();
    const month = String(selected.getMonth() + 1).padStart(2, "0");
    const dayStr = String(selected.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${dayStr}`;

    // console.log("📅 Date selected:", { day, selected, formattedDate });
    handleFilterChange("date", formattedDate);
  };

  const changeMonth = (offset) => {
    setCalendarDate(
      new Date(calendarDate.getFullYear(), calendarDate.getMonth() + offset, 1)
    );
  };

  const CustomDropdown = ({ label, filterType, options, displayFn }) => (
  <div ref={dropdownRefs[filterType]} className="relative">
    <div className="relative">
      <button
       onClick={() => {
        if (filterType === "status" && isStatusSearch(searchQuery)) {
          setSearchQuery("");
        }
        setOpenDropdown(openDropdown === filterType ? null : filterType);
      }}
        className={`w-full cursor-pointer flex items-center justify-between rounded-lg py-2.5 text-sm text-gray-700 transition-colors min-h-[42px]
        ${filters[filterType] ? "pl-10 pr-4" : "px-4"}
        ${
          openDropdown === filterType || filters[filterType]
            ? "border border-[#F9AB00]/40 bg-white"
            : "bg-gray-50 hover:bg-gray-100 border border-transparent"
        }`}
      >
        <span className="truncate mr-2 flex items-center gap-1">
          {filterType === "course" && filters[filterType] ? (
            <>
              <span className="text-[#88898A] font-light">Course</span>
              <span className="text-[#88898A]">|</span>
              <span className="text-[#1A73E8] font-normal">
                {
                  filterOptions.courses.find(
                    (c) => c.courseId === filters[filterType]
                  )?.courseCode
                }
              </span>
            </>
          ) : (
            <span
              className={`${
                filters[filterType]
                  ? "text-[#1A73E8] font-normal"
                  : "text-gray-500"
              }`}
            >
              {displayFn && filters[label]
                ? displayFn(filters[filterType])
                : filters[label] || label}
            </span>
          )}
        </span>

        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform ${
            openDropdown === filterType
              ? "rotate-180 text-yellow-500"
              : "text-gray-500"
          }`}
        />
      </button>

      {filters[filterType] && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleFilterChange(filterType, "");
      if (filterType === "status" && isStatusSearch(searchQuery)) {
        setSearchQuery("");
      }
    }}
    className={`absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors ${
      filters[filterType]
        ? "bg-[#88898A] hover:bg-gray-700"
        : "hover:bg-gray-200"
    }`}
  >
    <svg
      className="w-3 h-3 text-white"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </button>
)}
    </div>

    {openDropdown === filterType && (
      <div className="absolute z-50 mt-2 w-full bg-white px-1 py-1 rounded-lg shadow-lg border border-gray-200 max-h-72 overflow-y-auto scrollbar-custom">
        <button
          onClick={() => handleFilterChange(filterType, "")}
          className={`w-full text-left px-4 py-3 cursor-pointer text-sm hover:bg-gray-50 transition-colors ${
            filters[filterType] === ""
              ? "bg-[#E8F1FD] text-[#1A73E8] font-medium"
              : "border-transparent text-gray-700"
          }`}
        >
          All
        </button>
        {options.map((option) => {
          const id =
            option.courseId ??
            option.requestTypeId ?? 
            option;

          let label = option.courseName ?? option.requestName ?? option;
          if (filterType === "status") {
            label = formatStatusLabel(option);
          }
          
          const isSelected = filters[filterType] === id;
          
          return (
            <button
              key={id}
              onClick={() => handleFilterChange(filterType, id)}
              className={`w-full text-left rounded-xl px-4 py-3 cursor-pointer text-sm hover:bg-gray-50 transition-colors  ${
                isSelected
                  ? "bg-[#E8F1FD] text-[#1A73E8] font-medium"
                  : "border-transparent text-gray-700"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    )}

    <style jsx>{`
      .scrollbar-custom::-webkit-scrollbar {
        width: 8px;
      }
      .scrollbar-custom::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
      }
      .scrollbar-custom::-webkit-scrollbar-thumb {
        background: #3b82f6;
        border-radius: 10px;
      }
      .scrollbar-custom::-webkit-scrollbar-thumb:hover {
        background: #2563eb;
      }
    `}</style>
  </div>
);
  const CalendarPicker = () => {
    const { daysInMonth, startingDayOfWeek, year, month } =
      getDaysInMonth(calendarDate);
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return (
      <div ref={dropdownRefs.date} className="relative">
        <div className="relative">
          <button
            onClick={() =>
              setOpenDropdown(openDropdown === "date" ? null : "date")
            }
            className={`w-full flex items-center justify-between cursor-pointer rounded-lg py-2.5 text-sm text-gray-700 transition-all min-h-[42px]
          ${selectedDate ? "pl-10 pr-4" : "px-4"}
          ${
            openDropdown === "date" || selectedDate
              ? "border border-[#F9AB00]/40 bg-white"
              : "bg-gray-50 hover:bg-gray-100 border border-transparent"
          }`}
          >
            <span
              className={`truncate ${
                selectedDate ? "text-[#1A73E8] font-normal" : "text-gray-500"
              }`}
            >
              {selectedDate ? formatDateDisplay(selectedDate) : "Date"}
            </span>

            <ChevronDown
              className={`w-4 h-4 flex-shrink-0 transition-transform ${
                openDropdown === "date"
                  ? "rotate-180 text-yellow-500"
                  : "text-gray-500"
              }`}
            />
          </button>

          {/* Clear Button */}
          {selectedDate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDate(null);
                handleFilterChange("date", "");
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-[#88898A] hover:bg-gray-700 transition-colors"
            >
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {openDropdown === "date" && (
          <div className="absolute z-50 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => changeMonth(-1)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="font-medium text-gray-900">
                {monthNames[month]} {year}
              </span>
              <button
                onClick={() => changeMonth(1)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const isSelected =
                  selectedDate &&
                  selectedDate.getDate() === day &&
                  selectedDate.getMonth() === month &&
                  selectedDate.getFullYear() === year;

                return day ? (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(day)}
                    className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-[#F9AB00] text-white"
                        : "hover:bg-gray-100 text-gray-900"
                    }`}
                  >
                    {day}
                  </button>
                ) : (
                  <div key={index} />
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-transparent min-h-screen flex flex-col">
      <div className="flex flex-col bg-transparent w-full xl:justify-between pr-3 sm:px-3 lg:pr-7 md:pl-15 xl:px-9 xl:pr-7">
        <div className="flex flex-col lg:flex-row items-start lg:items-center pt-15 lg:pt-11 xl:pt-13 justify-between  lg:pr-9 gap-4">
          <div>
            <h1 className="text-3xl sm:text-3xl font-semibold text-left text-[#202124]">
              Transactions
            </h1>
            <p className="text-left text-[#686969] text-sm sm:text-base">
              View and track all past requests and activities
            </p>
          </div>

          <div className="rounded-lg w-full lg:w-md p-0 lg:p-4 mb-4">
            <div className="relative lg:top-2 lg:left-13">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, ID, course, request, or status."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className=" block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow-xs  p-4 mb-6">
            <div className="flex flex-wrap lg:flex-nowrap gap-4 items-end w-full">
              <div className="flex items-center h-full justify-center gap-2 text-[#88898A] font-medium text-sm whitespace-nowrap mb-2">
                <img
                  src="/assets/transactions/Filter.png"
                  alt="Filter"
                  className="w-6 h-6"
                />
                Filter
              </div>

              <div className="flex-1 min-w-[150px]">
                <CustomDropdown
                  label="Course"
                  filterType="course"
                  options={filterOptions.courses}
                  displayFn={(id) => {
                    const course = filterOptions.courses.find(
                      (c) => c.courseId === id
                    );
                    return course ? course.courseName : label;
                  }}
                />
              </div>

              <div className="flex-1 min-w-[150px]">
                <CustomDropdown
                  label="Request"
                  filterType="request"
                  options={filterOptions.requests}
                  displayFn={(id) => {
                    const req = filterOptions.requests.find(
                      (r) => r.requestTypeId === id
                    );
                    return req ? req.requestName : label;
                  }}
                />
              </div>

              <div className="flex-1 min-w-[150px]">
                <CustomDropdown
                  label="Status"
                  filterType="status"
                  options={filterOptions.statuses}
                  displayFn={formatStatusLabel}
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <CalendarPicker />
              </div>

              <button
                onClick={clearFilters}
                className="bg-transparent text-[#1A73E8] cursor-pointer font-medium py-2.5 px-6 rounded-lg text-sm  whitespace-nowrap"
              >
                Clear Filter
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200 h-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 w-32">
                    Student ID
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 w-48">
                    Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 w-40">
                    Course
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 w-56">
                    Request
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 w-32">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 w-36">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-4 sm:px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <LoadingIndicator />
                        <p className="text-sm text-gray-500">
                          Loading transactions...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left w-32">
                        {transaction.studentId}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left w-48">
                        {transaction.name}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left w-40">
                        {transaction.course}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left w-56">
                        {transaction.request}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-left w-32">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            transaction.status
                          )}`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left w-36">
                        {transaction.date}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 sm:px-6 py-8 text-center text-sm text-gray-500"
                    >
                      No transactions found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-transparent mt-4 mb-6 ">
          <div className="py-3 flex flex-col sm:flex-row items-center gap-4 ">
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {transactions.length > 0
                    ? (currentPage - 1) * itemsPerPage + 1
                    : 0}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, pagination.totalItems)}
                </span>{" "}
                of <span className="font-medium">{pagination.totalItems}</span>{" "}
                results
              </p>
            </div>
            <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md cursor-pointer ${
                  currentPage === 1
                    ? " text-gray-400 cursor-not-allowed"
                    : " text-gray-700 "
                }`}
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((pageNum, index) => {
                  if (pageNum === "...") {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 sm:px-3 py-2 text-gray-500 text-xs sm:text-sm"
                      >
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg cursor-pointer ${
                        currentPage === pageNum
                          ? "bg-[#1A73E8] text-white "
                          : " text-gray-700  "
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className={`relative inline-flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md cursor-pointer ${
                  currentPage === pagination.totalPages
                    ? " text-[#88898A] cursor-not-allowed"
                    : " text-gray-700 "
                }`}
              >
                Next
              </button>

              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={currentPage === pagination.totalPages}
                className={`relative inline-flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md cursor-pointer ${
                  currentPage === pagination.totalPages
                    ? " text-[#88898A] cursor-not-allowed"
                    : " text-gray-700 "
                }`}
              >
                Last
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}