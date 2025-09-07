import React from 'react'
import { Link } from 'react-router-dom'
import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div>
      <h1>layout</h1>
 <main>
              <Outlet />

 </main>

    </div>
  )
}
