import { PlusCircle, Box, Layers, DollarSign, Clock, ArrowRight } from 'lucide-react'
import './Dashboard.css'

export function Dashboard({ assets, setCurrentPage }) {
  const stats = [
    {
      label: 'Total Assets',
      value: assets.length,
      icon: Box,
      color: 'blue'
    },
    {
      label: 'Total Parts',
      value: assets.reduce((sum, a) => sum + (a.components?.length || 0), 0),
      icon: Layers,
      color: 'purple'
    },
    {
      label: 'Est. Cost',
      value: `$${(assets.length * 1.2).toFixed(2)}`,
      icon: DollarSign,
      color: 'green'
    },
    {
      label: 'Avg. Time',
      value: assets.length > 0 ? '~60s' : '--',
      icon: Clock,
      color: 'orange'
    }
  ]

  const recentAssets = assets.slice(-5).reverse()

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>EON 3D Objects</h1>
          <p>AI-powered 3D asset generation with automatic component segmentation</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setCurrentPage('new-asset')}
        >
          <PlusCircle size={20} />
          New Asset
        </button>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.color}`}>
            <div className="stat-icon">
              <stat.icon size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="quick-start card">
          <h2>Quick Start</h2>
          <div className="quick-start-steps">
            <div className="step">
              <span className="step-number">1</span>
              <div className="step-content">
                <strong>Upload Reference Images</strong>
                <p>Single image or up to 8 views for better reconstruction</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <div className="step-content">
                <strong>Generate 3D Mesh</strong>
                <p>Hunyuan3D creates textured mesh with PBR materials</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <div className="step-content">
                <strong>Automatic Segmentation</strong>
                <p>PartGen 1.5 detects and separates components</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <div className="step-content">
                <strong>Export & Integrate</strong>
                <p>Download GLB with hierarchical component structure</p>
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary full-width"
            onClick={() => setCurrentPage('new-asset')}
          >
            Create Your First Asset
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="recent-assets card">
          <h2>Recent Assets</h2>
          {recentAssets.length > 0 ? (
            <div className="asset-list">
              {recentAssets.map(asset => (
                <div key={asset.id} className="asset-item">
                  <div className="asset-thumb">
                    {asset.mesh?.thumbnail ? (
                      <img src={asset.mesh.thumbnail} alt={asset.name} />
                    ) : (
                      <Box size={24} />
                    )}
                  </div>
                  <div className="asset-info">
                    <div className="asset-name">{asset.name}</div>
                    <div className="asset-meta">
                      {asset.components?.length || 0} parts • {asset.category}
                    </div>
                  </div>
                  <span className={`status-badge ${asset.status}`}>
                    {asset.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Box size={48} />
              <p>No assets yet</p>
              <span>Create your first 3D asset to get started</span>
            </div>
          )}
        </div>
      </div>

      <div className="api-info card">
        <h2>API Integration</h2>
        <div className="api-cards">
          <div className="api-card">
            <div className="api-header">
              <span className="api-name">fal.ai</span>
              <span className="api-badge">Hunyuan3D V3</span>
            </div>
            <p>Image-to-3D mesh generation with PBR materials</p>
            <div className="api-cost">$0.375 - $0.60 per model</div>
          </div>
          <div className="api-card">
            <div className="api-header">
              <span className="api-name">AIML API</span>
              <span className="api-badge">Hunyuan-Part</span>
            </div>
            <p>Automatic mesh segmentation into components</p>
            <div className="api-cost">~$0.15 per segmentation</div>
          </div>
          <div className="api-card">
            <div className="api-header">
              <span className="api-name">Hunyuan Studio</span>
              <span className="api-badge">Public Beta</span>
            </div>
            <p>Interactive brush-based segmentation refinement</p>
            <div className="api-cost">Free (beta)</div>
          </div>
        </div>
      </div>
    </div>
  )
}
