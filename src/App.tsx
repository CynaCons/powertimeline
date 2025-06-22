import { Route, Routes } from 'react-router-dom'
import Header from '@/components/Header'
import Home from '@/pages/Home'
import Editor from '@/pages/Editor'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/editor" element={<Editor />} />
        </Routes>
      </div>
    </div>
  )
}
