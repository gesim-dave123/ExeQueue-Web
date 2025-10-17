import { Eye, Send, Trash2, User, Users, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useSocket } from "../../utils/hooks/useSocket";

const SocketTesting = () => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [publicMessage, setPublicMessage] = useState("");
  const [privateMessage, setPrivateMessage] = useState("");
  const [studentId, setStudentId] = useState("");
  const [currentRoom, setCurrentRoom] = useState("");

  // Test data for ExeQueue scenarios
  const [testData, setTestData] = useState({
    windowId: "1",
    currentServing: "R001",
    nextInLine: "R002",
    queueStatus: "WAITING",
    studentQueue: {
      id: "Q001",
      number: "R001",
      status: "SERVING",
      serviceType: "Scholarship Inquiry",
    },
  });

  useEffect(() => {
    if (!socket) return;

    // Event listeners for receiving messages
    const handleTestMessage = (data) => {
      console.log("Received testMessage:", data);
      addMessage("Stranger (Public)", data.message, "sent");
    };

    const handleReceiveBroadcast = (data) => {
      addMessage("Broadcast Received", JSON.stringify(data), "info");
    };

    const handleWindowUpdate = (data) => {
      addMessage("Window Update", data, "success");
    };

    const handleQueueUpdate = (data) => {
      addMessage("Queue Update", JSON.stringify(data), "success");
    };

    const handlePersonalQueueUpdate = (data) => {
      addMessage("Personal Queue Update", JSON.stringify(data), "warning");
    };

    const handleQueueCalled = (data) => {
      addMessage("Queue Called", JSON.stringify(data), "warning");
    };

    // Set up all event listeners
    socket.on("testMessage", handleTestMessage);
    socket.on("receiveBroadcast", handleReceiveBroadcast); // Fixed typo from 'recieveBroadcast'
    socket.on("windowUpdate", handleWindowUpdate);
    socket.on("queueUpdate", handleQueueUpdate);
    socket.on("personalQueueUpdate", handlePersonalQueueUpdate);
    socket.on("queueCalled", handleQueueCalled);
    socket.on("All", (data) => {
      addMessage("Announcement", JSON.stringify(data), "info");
    });

    // Connection events
    socket.on("connect", () => {
      addMessage("System", `Connected to server ID:${socket.id} `, "success");
    });

    socket.on("disconnect", () => {
      addMessage("System", "Disconnected from server", "error");
    });

    // Cleanup function
    return () => {
      if (socket) {
        socket.off("testMessage", handleTestMessage);
        socket.off("receiveBroadcast", handleReceiveBroadcast);
        socket.off("windowUpdate", handleWindowUpdate);
        socket.off("queueUpdate", handleQueueUpdate);
        socket.off("personalQueueUpdate", handlePersonalQueueUpdate);
        socket.off("queueCalled", handleQueueCalled);
        socket.off("connect");
        socket.off("disconnect");
      }
    };
  }, [socket]); // Add socket as dependency

  const addMessage = (sender, content, type = "info") => {
    console.log("addMessage called with:", { sender, content, type });
    const newMessage = {
      id: Date.now() + Math.random(), // Better unique ID
      sender,
      content,
      type,
      timestamp: new Date().toLocaleTimeString(),
    };
    console.log("Adding message:", newMessage);
    setMessages((prev) => [...prev, newMessage]);
  };

  const sendPublicMessage = () => {
    if (!socket || !publicMessage.trim()) return;

    // Emit the message
    socket.emit("testBroadcast", {
      id: `msg-${Date.now()}`,
      message: publicMessage,
      timestamp: new Date().toISOString(),
    });

    // Add to local messages immediately
    addMessage("You (Public)", publicMessage, "sent");
    setPublicMessage("");
  };

  const sendPrivateMessage = () => {
    if (!socket || !privateMessage.trim() || !studentId.trim()) return;

    socket.emit("testPrivateMessage", {
      studentId,
      message: privateMessage,
      timestamp: new Date().toISOString(),
    });

    addMessage(
      "You (Private)",
      `To student-${studentId}: ${privateMessage}`,
      "sent"
    );
    setPrivateMessage("");
  };

  const joinRoom = () => {
    if (!socket || !studentId.trim()) return;

    const room = `student-${studentId}`;
    socket.emit("joinRoom", room);
    setCurrentRoom(room);
    addMessage("System", `Joined room: ${room}`, "success");
  };

  const leaveRoom = () => {
    if (!socket || !currentRoom) return;

    socket.emit("leaveRoom", currentRoom);
    addMessage("System", `Left room: ${currentRoom}`, "success");
    setCurrentRoom("");
  };

  const sendExeQueueEvent = (eventType) => {
    if (!socket) return;

    let eventData = {};

    switch (eventType) {
      case "windowUpdate":
        eventData = {
          windowId: testData.windowId,
          currentServing: testData.currentServing,
          nextInLine: testData.nextInLine,
        };
        break;
      case "queueUpdate":
        eventData = {
          queueNumber: testData.currentServing,
          status: testData.queueStatus,
          windowId: testData.windowId,
        };
        break;
      case "personalQueueUpdate":
        eventData = testData.studentQueue;
        break;
      default:
        eventData = { type: eventType, data: testData };
    }

    socket.emit(eventType, eventData);
    addMessage(
      "You (Event)",
      `Sent ${eventType}: ${JSON.stringify(eventData)}`,
      "sent"
    );
  };

  const getMessageStyle = (type) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "sent":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  // Remove the socket null check at the beginning since useSocket handles this
  // Your useSocket hook returns a socket instance that might be null initially

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Socket.IO Testing Area - ExeQueue
          </h1>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <Wifi className="w-5 h-5 text-green-500" />
                <span className="text-green-600 font-medium">Connected</span>
                {socket && (
                  <span className="text-xs text-gray-500">ID: {socket.id}</span>
                )}
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-500" />
                <span className="text-red-600 font-medium">Disconnected</span>
              </>
            )}
          </div>
        </div>

        {!socket && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">Socket connecting... Please wait.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls Section */}
          <div className="space-y-6">
            {/* Room Management */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Room Management
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter student ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={joinRoom}
                    disabled={!studentId.trim() || !socket}
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                  >
                    Join Room
                  </button>
                  <button
                    onClick={leaveRoom}
                    disabled={!currentRoom || !socket}
                    className="flex-1 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 disabled:opacity-50"
                  >
                    Leave Room
                  </button>
                </div>
                {currentRoom && (
                  <p className="text-sm text-green-600">
                    Current room: {currentRoom}
                  </p>
                )}
              </div>
            </div>

            {/* Public Broadcast */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Public Broadcast
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={publicMessage}
                  onChange={(e) => setPublicMessage(e.target.value)}
                  placeholder="Enter public message"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === "Enter" && sendPublicMessage()}
                  disabled={!socket}
                />
                <button
                  onClick={sendPublicMessage}
                  disabled={!socket}
                  className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:opacity-50 flex items-center justify-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Public Message
                </button>
              </div>
            </div>

            {/* Private Message */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Private Message
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={privateMessage}
                  onChange={(e) => setPrivateMessage(e.target.value)}
                  placeholder="Enter private message"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === "Enter" && sendPrivateMessage()}
                  disabled={!socket}
                />
                <button
                  onClick={sendPrivateMessage}
                  disabled={!studentId.trim() || !socket}
                  className="w-full bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Private Message
                </button>
              </div>
            </div>

            {/* ExeQueue Events */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">ExeQueue Events</h3>
              <div className="space-y-2">
                <button
                  onClick={() => sendExeQueueEvent("windowUpdate")}
                  disabled={!socket}
                  className="w-full bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 disabled:opacity-50 text-left"
                >
                  Send Window Update
                </button>
                <button
                  onClick={() => sendExeQueueEvent("queueUpdate")}
                  disabled={!socket}
                  className="w-full bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 disabled:opacity-50 text-left"
                >
                  Send Queue Update
                </button>
                <button
                  onClick={() => sendExeQueueEvent("personalQueueUpdate")}
                  disabled={!socket}
                  className="w-full bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 disabled:opacity-50 text-left"
                >
                  Send Personal Queue Update
                </button>
              </div>
            </div>

            {/* Test Data Editor - unchanged */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Test Data</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="block text-gray-600">Window ID</label>
                  <input
                    type="text"
                    value={testData.windowId}
                    onChange={(e) =>
                      setTestData({ ...testData, windowId: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-600">Current Serving</label>
                  <input
                    type="text"
                    value={testData.currentServing}
                    onChange={(e) =>
                      setTestData({
                        ...testData,
                        currentServing: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-600">Next in Line</label>
                  <input
                    type="text"
                    value={testData.nextInLine}
                    onChange={(e) =>
                      setTestData({ ...testData, nextInLine: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-600">Queue Status</label>
                  <select
                    value={testData.queueStatus}
                    onChange={(e) =>
                      setTestData({ ...testData, queueStatus: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="WAITING">WAITING</option>
                    <option value="SERVING">SERVING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="DEFERRED">DEFERRED</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Section - unchanged */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Messages Log
              </h3>
              <button
                onClick={() => setMessages([])}
                className="text-red-500 hover:text-red-700 flex items-center text-sm"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </button>
            </div>
            <div className="bg-white border rounded-lg h-96 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No messages yet. Start testing!
                </p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg border ${getMessageStyle(
                      message.type
                    )}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">
                        {message.sender}
                      </span>
                      <span className="text-xs opacity-75">
                        {message.timestamp}
                      </span>
                    </div>
                    <p className="text-sm break-words">{message.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocketTesting;
