// File: hooks/useSocket.js
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import backendConnection from "../../api/backendConnection"; // Adjust path as needed
import { showToast } from "../../components/toast/ShowToast";

export const useSocket = () => {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null); // ✅ Add this
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(backendConnection(), {
        withCredentials: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000,
      });

      setSocket(socketRef.current); // ✅ Set socket in state

      socketRef.current.on("connect", () => {
        console.log("🟢 Socket connected:", socketRef.current.id);
        setIsConnected(true);
      });

      socketRef.current.on("disconnect", (reason) => {
        console.log("🔴 Socket disconnected:", reason);
        showToast("Socket disconnected", "error");
        setIsConnected(false);
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
        showToast("Socket connection error", "error");
        setIsConnected(false);
      });
    }

    return () => {
      if (socketRef.current) {
        console.log("🧹 Cleaning up socket connection");
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("connect_error");
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null); // ✅ Clear state too
      }
    };
  }, []);

  return {
    socket, // ✅ Return from state, not ref
    isConnected,
  };
};
// Alternative: If you want a singleton socket (shared across all components)
let globalSocket = null;

export const useGlobalSocket = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create global socket instance only once
    if (!globalSocket) {
      globalSocket = io(backendConnection(), {
        withCredentials: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000,
      });

      globalSocket.on("connect", () => {
        console.log("🟢 Global socket connected:", globalSocket.id);
      });

      globalSocket.on("disconnect", (reason) => {
        console.log("🔴 Global socket disconnected:", reason);
      });
    }

    // Set up local connection status tracking
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    globalSocket.on("connect", handleConnect);
    globalSocket.on("disconnect", handleDisconnect);

    // Set initial state
    setIsConnected(globalSocket.connected);

    // Cleanup local listeners only (don't disconnect global socket)
    return () => {
      globalSocket.off("connect", handleConnect);
      globalSocket.off("disconnect", handleDisconnect);
    };
  }, []);

  return {
    socket: globalSocket,
    isConnected,
  };
};
