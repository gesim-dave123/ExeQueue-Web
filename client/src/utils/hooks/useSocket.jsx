// File: hooks/useSocket.js
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import backendConnection from "../../api/backendConnection"; // Adjust path as needed
import { showToast } from "../../components/toast/ShowToast";

export const useSocket = (onDisconnectOrCleanup) => {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socketRef.current) {
      const token = sessionStorage.getItem("auth_token");

      socketRef.current = io(backendConnection(), {
        withCredentials: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000,
        extraHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        auth: {
          token: token,
        },
      });

      setSocket(socketRef.current); // ✅ Set socket in state

      socketRef.current.on("connect", () => {
        console.log("Connected:", socketRef.current.id);
        showToast("Connected", "success");
        setIsConnected(true);
      });

      socketRef.current.on("disconnect", (reason) => {
        console.log("Disconnected:", reason);
        onDisconnectOrCleanup?.();
        showToast("Disconnected", "error");
        setIsConnected(false);
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("Cconnection error:", error);
        onDisconnectOrCleanup?.();
        showToast("Connection error", "error");
        setIsConnected(false);
      });
    }

    return () => {
      if (socketRef.current) {
        console.log("🧹 Cleaning up socket connection");
        onDisconnectOrCleanup?.();
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
