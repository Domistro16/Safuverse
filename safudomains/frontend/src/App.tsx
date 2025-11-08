import { Route, Routes } from 'react-router-dom'
import Home from './components/home'
import Register from './components/register'
import Resolve from './components/resolve'
import Names from './components/names'
import Nav from './components/nav'
import { MobileNav } from './components/mobilenav'


function App() {
  
  return (
    <>
      <Nav />
      <MobileNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register/:label" element={<Register />} />
        <Route path="/resolve/:label" element={<Resolve />} />
        <Route path="/mynames" element={<Names />} />
      </Routes>
    </>
  )
}

export default App
