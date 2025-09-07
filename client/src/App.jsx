import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing'
import AboutUs from './pages/AboutUs'

function App() {
  const [count, setCount] = useState(0)

  return (
   <div>
    <Router>
      <Routes>
        <Route element = {<Layout/>}>
          <Route path = "/" element = {<Landing/>}></Route>
          <Route path = "/about" element ={<AboutUs/>}></Route>
        </Route>
      </Routes>
    </Router>
   </div>
  )
}

export default App
