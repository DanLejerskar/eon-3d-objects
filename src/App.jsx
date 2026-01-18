import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { NewAsset } from './pages/NewAsset'
import { AssetLibrary } from './pages/AssetLibrary'
import { Settings } from './pages/Settings'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [assets, setAssets] = useState([])

  const addAsset = (asset) => {
    setAssets(prev => [...prev, asset])
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard assets={assets} setCurrentPage={setCurrentPage} />
      case 'new-asset':
        return <NewAsset addAsset={addAsset} setCurrentPage={setCurrentPage} />
      case 'library':
        return <AssetLibrary assets={assets} />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard assets={assets} setCurrentPage={setCurrentPage} />
    }
  }

  return (
    <div className="app">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
