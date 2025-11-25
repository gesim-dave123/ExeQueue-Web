// Global map to track SSE clients per channel
const sseChannels = new Map();

/**
 * Subscribe a client to an SSE channel
 */
export const addClient = (channel, req, res) => {
  // Initialize channel if missing
  if (!sseChannels.has(channel)) {
    sseChannels.set(channel, []);
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Initial handshake
  res.write(
    `data: ${JSON.stringify({
      type: "connected",
      message: `SSE stream connected to "${channel}"`,
    })}\n\n`
  );

  // Add client to channel list
  const clients = sseChannels.get(channel);
  clients.push(res);
  console.log(`🟢 [${channel}] New client connected. Total: ${clients.length}`);

  // Handle disconnect
  req.on("close", () => {
    const updatedClients = (sseChannels.get(channel) || []).filter(
      (client) => client !== res
    );
    sseChannels.set(channel, updatedClients);
    console.log(
      `🔴 [${channel}] Client disconnected. Total: ${updatedClients.length}`
    );
  });
};

/**
 * Broadcast message to all clients in a specific channel
 */
export const broadcast = (channel, eventType, data = {}) => {
  const clients = sseChannels.get(channel) || [];
  if (clients.length === 0) return;

  const message = JSON.stringify({
    type: eventType,
    timestamp: new Date().toISOString(),
    ...data,
  });

  console.log(`📡 [${channel}] Broadcasting to ${clients.length} clients`);

  clients.forEach((client) => {
    try {
      client.write(`data: ${message}\n\n`);
    } catch (error) {
      console.error(`⚠️ [${channel}] Error sending message:`, error);
    }
  });
};

/**
 * Get current connected clients count (optional helper)
 */
export const getClientCount = (channel) =>
  (sseChannels.get(channel) || []).length;
