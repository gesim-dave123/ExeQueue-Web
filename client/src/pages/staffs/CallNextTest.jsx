import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import backendConnection from '../../api/backendConnection';

const CallNextTest = () => {
  // Mock user data - replace with your actual auth context
  const [currentUser, setCurrentUser] = useState({
    staffId: 'staff-123',
    firstName: 'John',
    lastName: 'Doe',
    windowId: null, // Initially no window assigned
    windowNo: null
  });

  // Component state
  const [windows, setWindows] = useState([]);
  const [currentQueue, setCurrentQueue] = useState(null);
  const [nextInLine, setNextInLine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Mock windows data
  useEffect(() => {
    setWindows([
      { 
        windowId: 1, 
        windowNo: 1, 
        windowName: 'Window 1', 
        canServePriority: true, 
        canServeRegular: true,
        isOccupied: false 
      },
      { 
        windowId: 2, 
        windowNo: 2, 
        windowName: 'Window 2', 
        canServePriority: true, 
        canServeRegular: false,
        isOccupied: false 
      }
    ]);
  }, []);

  useEffect(() => {
    const socket = io(backendConnection(), {
      withCredentials: true,
    })
    socket.on('connect',()=>{
      console.log('🟢 Connected to server via WebSocket:', socket.id);
    })

    socket.emit("custom-event", 32, 'tae', { a: 1, b: 2 });
    

        // Listen for disconnect
    socket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };

  },[])

  // Assign staff to window
  const handleAssignWindow = async (windowNo) => {
    setLoading(true);
    setError('');
    
    try {
      // Replace with your actual API endpoint
      const response = await fetch('/api/staff/assign-window', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add your auth headers here
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          staffId: currentUser.staffId,
          windowNo: windowNo
        })
      });

      const data = await response.json();

      if (data.success) {
        setCurrentUser(prev => ({
          ...prev,
          windowId: data.data.assignedWindow.windowId,
          windowNo: windowNo
        }));
        setMessage(`Successfully assigned to Window ${windowNo}`);
        fetchNextInLine(windowNo);
      } else {
        setError(data.message || 'Failed to assign window');
      }
    } catch (err) {
      setError('Network error. Using mock assignment for testing.');
      // Mock assignment for testing
      setCurrentUser(prev => ({
        ...prev,
        windowId: windowNo,
        windowNo: windowNo
      }));
      mockFetchNextInLine(windowNo);
    } finally {
      setLoading(false);
    }
  };

  // Fetch next queue in line
  const fetchNextInLine = async (windowNo) => {
    try {
      const response = await fetch(`/api/windows/${windowNo}/next-in-line`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      setNextInLine(data.data?.nextQueue || null);
    } catch (err) {
      // Mock data for testing
      mockFetchNextInLine(windowNo);
    }
  };

  // Mock fetch for testing
  const mockFetchNextInLine = (windowNo) => {
    // Mock next queue data
    const mockQueues = [
      {
        queueId: 1,
        queueNumber: 5,
        queueType: 'REGULAR',
        studentFullName: 'John Doe',
        schoolId: '12345678',
        requests: [
          { requestType: { requestName: 'Good Moral Certificate' } },
          { requestType: { requestName: 'Gate Pass' } }
        ]
      },
      {
        queueId: 2,
        queueNumber: 3,
        queueType: 'PRIORITY',
        studentFullName: 'Jane Smith',
        schoolId: '87654321',
        requests: [
          { requestType: { requestName: 'Insurance Payment' } }
        ]
      }
    ];

    // Simulate different queues for different windows
    const nextQueue = windowNo === 1 ? mockQueues[0] : mockQueues[1];
    setNextInLine(nextQueue);
  };

  // Call next queue
  const handleCallNext = async () => {
    if (!currentUser.windowId) {
      setError('Please assign yourself to a window first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/queue/call-next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          staffId: currentUser.staffId,
          // windowId: currentUser.windowId // Use this if your API expects windowId instead
        })
      });

      const data = await response.json();

      if (data.success) {
        setCurrentQueue(data.data);
        setMessage(`Successfully called Queue #${data.data.queueNumber}`);
        // Fetch next queue in line
        fetchNextInLine(currentUser.windowNo);
      } else {
        setError(data.message || 'Failed to call next queue');
      }
    } catch (err) {
      setError('Network error. Using mock call for testing.');
      // Mock successful call for testing
      if (nextInLine) {
        setCurrentQueue(nextInLine);
        setMessage(`Successfully called Queue #${nextInLine.queueNumber}`);
        // Mock next queue
        mockFetchNextInLine(currentUser.windowNo);
      }
    } finally {
      setLoading(false);
    }
  };

  // Complete current queue
  const handleCompleteQueue = () => {
    setCurrentQueue(null);
    setMessage('Queue completed');
    fetchNextInLine(currentUser.windowNo);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Queue Management - Call Next Test</h1>
      
      {/* Messages */}
      {message && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#d4edda', 
          border: '1px solid #c3e6cb',
          borderRadius: '5px',
          marginBottom: '20px' 
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb',
          borderRadius: '5px',
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      {/* Staff Info */}
      <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Staff Information</h3>
        <p><strong>Name:</strong> {currentUser.firstName} {currentUser.lastName}</p>
        <p><strong>Staff ID:</strong> {currentUser.staffId}</p>
        <p><strong>Assigned Window:</strong> {currentUser.windowNo ? `Window ${currentUser.windowNo}` : 'Not assigned'}</p>
      </div>

      {/* Window Assignment */}
      {!currentUser.windowId && (
        <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h3>Select Your Window</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            {windows.map(window => (
              <button
                key={window.windowId}
                onClick={() => handleAssignWindow(window.windowNo)}
                disabled={loading || window.isOccupied}
                style={{
                  padding: '10px 15px',
                  backgroundColor: window.isOccupied ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: window.isOccupied ? 'not-allowed' : 'pointer'
                }}
              >
                {window.windowName}
                <br />
                <small>
                  {window.canServePriority && 'Priority '}
                  {window.canServeRegular && 'Regular'}
                </small>
                {window.isOccupied && <div><small>Occupied</small></div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard */}
      {currentUser.windowId && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Currently Serving */}
          <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <h3>Currently Serving - Window {currentUser.windowNo}</h3>
            {currentQueue ? (
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
                  Queue #{currentQueue.queueNumber}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Type:</strong> {currentQueue.queueType}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Student:</strong> {currentQueue.studentFullName}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>ID:</strong> {currentQueue.schoolId}
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <strong>Services:</strong>
                  <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                    {currentQueue.requests?.map((req, index) => (
                      <li key={index}>{req.requestType.requestName}</li>
                    ))}
                  </ul>
                </div>
                <button 
                  onClick={handleCompleteQueue}
                  style={{
                    padding: '8px 15px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Complete Queue
                </button>
              </div>
            ) : (
              <div style={{ color: '#6c757d', fontStyle: 'italic' }}>
                No queue currently being served
              </div>
            )}
          </div>

          {/* Next in Line */}
          <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <h3>Next in Line</h3>
            {nextInLine ? (
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
                  Queue #{nextInLine.queueNumber}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Type:</strong> {nextInLine.queueType}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Student:</strong> {nextInLine.studentFullName}
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <strong>Services:</strong>
                  <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                    {nextInLine.requests?.map((req, index) => (
                      <li key={index}>{req.requestType.requestName}</li>
                    ))}
                  </ul>
                </div>
                <button 
                  onClick={handleCallNext}
                  disabled={loading || currentQueue !== null}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: currentQueue ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: currentQueue ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  {loading ? 'Calling...' : 'Call Next Queue'}
                </button>
              </div>
            ) : (
              <div style={{ color: '#6c757d', fontStyle: 'italic' }}>
                No queues waiting
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h4>API Endpoints Expected:</h4>
        <ul>
          <li><code>POST /api/staff/assign-window</code> - Assign staff to window</li>
          <li><code>GET /api/windows/:windowNo/next-in-line</code> - Get next queue prediction</li>
          <li><code>POST /api/queue/call-next</code> - Call next queue</li>
        </ul>
        <p><small>Component will use mock data if API calls fail, so you can test the UI flow.</small></p>
      </div>
    </div>
  );
};

export default CallNextTest;