import { useState } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import './App.css';
import Layout from './components/Layout';
import AboutUs from './pages/AboutUs';
import Landing from './pages/Landing';
import Login from './pages/Login';

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
          <Route path = "/staff/login" element={<Login/>}></Route> 
        </Route>
      </Routes>
    </Router>
   </div>
  )
}

export default App
