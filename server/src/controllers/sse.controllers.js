let dashboardClients = [];

export const streamDashboardUpdates = (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Send initial connection message
  res.write(
    'data: {"type":"connected","message":"Dashboard stream connected"}\n\n'
  );

  // Add client to the list
  dashboardClients.push(res);
  console.log(
    `🟢 New dashboard client connected. Total: ${dashboardClients.length}`
  );

  // Handle client disconnect
  req.on('close', () => {
    dashboardClients = dashboardClients.filter((client) => client !== res);
    console.log(
      `🔴 Dashboard client disconnected. Total: ${dashboardClients.length}`
    );
  });
};

export const sendDashboardUpdate = (data = {}) => {
  const message = JSON.stringify({
    type: 'dashboard-update',
    timestamp: new Date().toISOString(),
    ...data,
  });

  console.log(
    `📡 Broadcasting to ${dashboardClients.length} dashboard clients`
  );

  dashboardClients.forEach((client) => {
    try {
      client.write(`data: ${message}\n\n`);
    } catch (error) {
      console.error('Error sending to client:', error);
    }
  });
};
