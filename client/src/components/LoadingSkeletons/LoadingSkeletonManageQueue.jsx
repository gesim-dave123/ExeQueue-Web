// Individual skeleton components that can be used separately
export const HeaderSkeleton = () => (
  <div className="h-8 bg-gray-200 rounded w-64 mb-9 mt-6 animate-pulse" />
);

export const MainCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-xs mb-4 overflow-hidden">
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-[#F5F5F5] p-2 rounded-xl">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* container */}
      <div className="flex items-start flex-col lg:flex-row justify-between gap-6 h-full">
        {/* left side */}
        <div className="border-2 flex-1 border-[#E2E3E4] rounded-lg p-6 w-full lg:auto h-full">
          <div className="text-left mb-4">
            <div className="text-7xl text-center ring-1 rounded-xl py-4 font-bold mb-2 bg-gray-200 animate-pulse h-32 flex items-center justify-center">
              <div className="h-12 w-20 bg-gray-300 rounded"></div>
            </div>
            <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse"></div>
          </div>

          <div className="space-y-3 text-sm text-left">
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded mb-1 animate-pulse"></div>
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 w-20 bg-gray-200 rounded mb-1 animate-pulse"></div>
              <div className="h-5 w-28 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-1 animate-pulse"></div>
              <div className="h-5 w-36 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 w-12 bg-gray-200 rounded mb-1 animate-pulse"></div>
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* right side */}
        <div className="flex flex-col flex-5 w-full justify-between">
          <div className="flex-1">
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="h-75 overflow-y-auto custom-scrollbar">
                  <table className="w-full">
                    <thead className="bg-white sticky top-0 z-10">
                      <tr className="border-b border-gray-200">
                        <th colSpan="3" className="text-left py-5 px-4">
                          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
                        </th>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4">
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                        </th>
                        <th className="text-left py-3 px-4">
                          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                        </th>
                        <th className="text-center py-3 px-4">
                          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...Array(3)].map((_, index) => (
                        <tr key={index} className="border-b border-gray-200">
                          <td className="text-left py-3 px-4">
                            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                          </td>
                          <td className="text-left py-3 px-4">
                            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex gap-2 items-center justify-center">
                              {[...Array(4)].map((_, btnIndex) => (
                                <div key={btnIndex} className="relative group">
                                  <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-15 justify-end">
            <div className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-200 animate-pulse">
              <div className="w-5 h-5 bg-gray-300 rounded"></div>
              <div className="h-5 w-20 bg-gray-300 rounded"></div>
            </div>
            <div className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-200 animate-pulse">
              <div className="w-5 h-5 bg-gray-300 rounded"></div>
              <div className="h-5 w-24 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const SectionSkeleton = () => (
  <div className="bg-white rounded-xl shadow-xs mb-4 p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-5 bg-gray-200 rounded w-24 animate-pulse" />
        <div className="h-6 bg-gray-200 rounded-full w-6 animate-pulse" />
      </div>
      <div className="h-5 bg-gray-200 rounded w-5 animate-pulse" />
    </div>
  </div>
);

export const DeferredTableSkeleton = () => (
  <div className="bg-white rounded-xl shadow-xs mb-4 overflow-hidden">
    <div className="p-4">
      <div className="mb-4 text-right">
        <div className="relative inline-block max-w-md w-full">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-y-scroll custom-scrollbar max-h-96">
          <table className="w-full min-w-[700px]">
            <thead className="bg-white sticky top-0 z-10">
              <tr className="border-b border-[#E2E3E4]">
                {[1, 2, 3, 4].map((col) => (
                  <th key={col} className="text-left py-3 px-4">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((row) => (
                <tr key={row} className="border-b border-[#E2E3E4]">
                  {[1, 2, 3, 4].map((cell) => (
                    <td key={cell} className="py-3 px-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);
// New component - just the table part
export const DeferredTableOnlySkeleton = ({ rows = 4, cols = 4 }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <div className="overflow-y-scroll custom-scrollbar max-h-96">
      <table className="w-full min-w-[700px]">
        <thead className="bg-white sticky top-0 z-10">
          <tr className="border-b border-[#E2E3E4]">
            {[...Array(cols)].map((_, col) => (
              <th key={col} className="text-left py-3 px-4">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(rows)].map((_, row) => (
            <tr key={row} className="border-b border-[#E2E3E4]">
              {[...Array(cols)].map((_, cell) => (
                <td key={cell} className="py-3 px-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const NextInLineTableSkeleton = () => (
  <div className="bg-white rounded-xl shadow-xs overflow-hidden">
    <div className="p-4">
      <div className="mb-4 text-right">
        <div className="relative inline-block max-w-md w-full">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-y-auto custom-scrollbar max-h-96 relative">
          <table className="w-full min-w-[700px]">
            <thead className="sticky top-0 z-10 bg-white">
              <tr>
                {[1, 2, 3, 4, 5].map((col) => (
                  <th key={col} className="text-left py-3 px-4">
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((row) => (
                <tr key={row} className="border-b border-[#E2E3E4]">
                  {[1, 2, 3, 4, 5].map((cell) => (
                    <td key={cell} className="py-4 px-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);
export const NextInLineTableOnlySkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <div className="overflow-y-auto custom-scrollbar max-h-96 relative">
      <table className="w-full min-w-[700px]">
        <thead className="sticky top-0 z-10 bg-white">
          <tr>
            {[...Array(cols)].map((_, col) => (
              <th key={col} className="text-left py-3 px-4">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(rows)].map((_, row) => (
            <tr key={row} className="border-b border-[#E2E3E4]">
              {[...Array(cols)].map((_, cell) => (
                <td key={cell} className="py-4 px-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Main composite skeleton component (same as before)
export const LoadingSkeleton = ({
  showHeader = true,
  showMainCard = true,
  showDeferredSections = true,
  showNextInLine = false,
  showDeferredTable = false,
  showNextInLineTable = false,
  isLoading = true,
}) => {
  if (!isLoading) return null;

  return (
    <div className="min-h-screen bg-transparent w-full p-4 md:p-10">
      <div className="max-w-full mx-auto">
        {showHeader && <HeaderSkeleton />}
        {showMainCard && <MainCardSkeleton />}
        {showDeferredSections && (
          <>
            <SectionSkeleton />
            <SectionSkeleton />
          </>
        )}
        {showDeferredTable && <DeferredTableSkeleton />}
        {showNextInLineTable && <NextInLineTableSkeleton />}
      </div>
    </div>
  );
};
