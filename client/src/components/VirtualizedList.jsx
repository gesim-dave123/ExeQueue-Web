import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";

/**
 * Generic Virtualized List Component
 *
 * @param {Object} props
 * @param {Array} props.items - Array of items to render
 * @param {Function} props.renderItem - Function to render each item (item, index) => ReactNode
 * @param {number} props.estimateSize - Estimated height of each item in pixels
 * @param {number} props.height - Container height in pixels or string
 * @param {boolean} props.hasMore - Whether there are more items to load
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.onLoadMore - Callback when more items should be loaded
 * @param {string} props.emptyMessage - Message to show when no items
 * @param {number} props.overscan - Number of items to render outside visible area
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional styles
 * @param {Function} props.loadingComponent - Custom loading component
 * @param {Function} props.emptyComponent - Custom empty state component
 */
const VirtualizedList = ({
  items = [],
  renderItem,
  estimateSize = 80,
  height = 400,
  hasMore = false,
  isLoading = false,
  onLoadMore,
  emptyMessage = "No items found",
  overscan = 5,
  className = "",
  style = {},
  loadingComponent,
  emptyComponent,
  ...props
}) => {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: hasMore ? items.length + 1 : items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  // Auto-load more when scrolling near bottom
  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse();

    if (
      lastItem &&
      lastItem.index >= items.length - 1 &&
      hasMore &&
      !isLoading &&
      onLoadMore
    ) {
      onLoadMore();
    }
  }, [
    virtualizer.getVirtualItems(),
    hasMore,
    isLoading,
    items.length,
    onLoadMore,
  ]);

  const virtualItems = virtualizer.getVirtualItems();

  // Default loading component
  const DefaultLoadingComponent = () => (
    <div className="flex justify-center items-center py-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      <span className="ml-2 text-sm text-gray-600">Loading more...</span>
    </div>
  );

  // Default empty component
  const DefaultEmptyComponent = () => (
    <div className="flex justify-center items-center py-8 text-gray-500">
      {emptyMessage}
    </div>
  );

  const LoadingComponent = loadingComponent || DefaultLoadingComponent;
  const EmptyComponent = emptyComponent || DefaultEmptyComponent;

  return (
    <div
      ref={parentRef}
      className={`virtualized-list ${className}`}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        overflow: "auto",
        ...style,
      }}
      {...props}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualItem) => {
          const isLoaderRow = virtualItem.index > items.length - 1;
          const item = items[virtualItem.index];

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {isLoaderRow ? (
                hasMore ? (
                  <LoadingComponent />
                ) : null
              ) : item ? (
                renderItem(item, virtualItem.index)
              ) : items.length === 0 ? (
                <EmptyComponent />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VirtualizedList;
