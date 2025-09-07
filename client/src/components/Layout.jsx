import React from 'react'
import { Link } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div>
      <Navbar></Navbar>
      <main>
          <Outlet />

      </main>

    </div>
  )
}
