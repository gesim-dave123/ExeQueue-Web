import backendConnection from "./backendConnection.js";

const activeConnections = {};

export const SSE = {
  /**
   * Subscribe to a server-sent events stream by feature name.
   * @param {string} feature - The feature key (e.g. "dashboard", "live-display")
   * @param {function} onMessage - Called whenever data is received
   * @param {object} options - Optional { onOpen, onError }
   */
  subscribe(feature, onMessage, options = {}) {
    // Prevent duplicate connections
    if (activeConnections[feature]) {
      console.warn(`SSE for '${feature}' already active.`);
      return activeConnections[feature];
    }

    const token = sessionStorage.getItem("auth_token");
    const endpoint = `${backendConnection()}/api/${feature}/stream?token=${token}`;
    const eventSource = new EventSource(endpoint, { withCredentials: true });

    eventSource.onopen = () => {
      console.log(`SSE connected to '${feature}'`);
      options.onOpen?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch (err) {
        console.error(`SSE parse error (${feature}):`, err);
      }
    };

    eventSource.onerror = (error) => {
      console.error(`SSE error (${feature}):`, error);
      options.onError?.(error);
    };

    activeConnections[feature] = eventSource;
    return eventSource;
  },

  /**
   * Unsubscribe and close the SSE connection.
   */
  unsubscribe(feature) {
    const connection = activeConnections[feature];
    if (connection) {
      console.log(`🔴 Closing SSE for '${feature}'`);
      connection.close();
      delete activeConnections[feature];
    }
  },

  /**
   * Close all active SSE connections (useful on logout or unmount).
   */
  closeAll() {
    Object.keys(activeConnections).forEach((feature) =>
      SSE.unsubscribe(feature)
    );
  },
};
