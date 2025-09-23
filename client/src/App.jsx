import { useState } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import './App.css';
import Layout from './components/Layout';
import AboutUs from './pages/AboutUs';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Request from './pages/students/Request';
import Dashboard from './pages/Dashboard';
import LayoutDashboard from './components/LayoutDashboard';
import Help from './pages/Help';
import FAQs from './pages/FAQs';
import Contact from './pages/Contact';
import Home from './pages/Home';
import LoginStaff from './pages/staffs/LoginStaff';
import LiveQueue from './pages/LiveQueue';


function App() {
  const [count, setCount] = useState(0)

  return (
   <div>
    <Toaster richColors position='top-right'
            expand limit={2}/>
    <Router>
      <Routes>
        <Route element = {<Layout/>}>
          <Route path = "/" element = {<Landing/>}></Route>
          <Route path = "/about" element ={<AboutUs/>}></Route>
          <Route path = "/help" element ={<Help/>}></Route>
          <Route path="/faq" element={<FAQs/>}></Route>
          <Route path="/footer" element={<Contact/>}></Route>
          <Route path = "/staff/login" element={<LoginStaff/>}></Route> 
          <Route path= "/student/request" element={<Request/>}></Route>
          <Route path="/student/live-queue" element={<LiveQueue/>}></Route>
        </Route>
        {/* <Route>
          <Route path="/staff/call-next" element={<CallNextTest/>}></Route>
        </Route> */}
      </Routes>
    </Router>

    <Router>
      <Routes>
          <Route element = {<LayoutDashboard/>}> 
           <Route path = "/dashboard" element = {<Dashboard/>}></Route>
           </Route>   
      </Routes>
    </Router>
   </div>
  )
}

export default App
