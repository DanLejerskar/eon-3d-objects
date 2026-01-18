import { useState } from 'react'
import { Search, Filter, Grid, List, Box, Download, Eye, Layers, Calendar, Tag } from 'lucide-react'
import { ModelViewer } from '../components/ModelViewer'
import './AssetLibrary.css'

export function AssetLibrary({ assets }) {
  const [viewType, setViewType] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [filterCategory, setFilterCategory] = useState('all')

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || asset.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['all', ...new Set(assets.map(a => a.category))]

  return (
    <div className="asset-library">
      <div className="library-header">
        <h1>Asset Library</h1>
        <p>{assets.length} assets generated</p>
      </div>

      <div className="library-toolbar">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={18} />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="view-toggle">
          <button
            className={viewType === 'grid' ? 'active' : ''}
            onClick={() => setViewType('grid')}
          >
            <Grid size={18} />
          </button>
          <button
            className={viewType === 'list' ? 'active' : ''}
            onClick={() => setViewType('list')}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {filteredAssets.length > 0 ? (
        <div className={`assets-container ${viewType}`}>
          {filteredAssets.map(asset => (
            <div
              key={asset.id}
              className={`asset-card ${selectedAsset?.id === asset.id ? 'selected' : ''}`}
              onClick={() => setSelectedAsset(asset)}
            >
              <div className="asset-preview">
                {asset.mesh?.thumbnail ? (
                  <img src={asset.mesh.thumbnail} alt={asset.name} />
                ) : (
                  <Box size={48} />
                )}
                <div className="asset-overlay">
                  <button className="preview-btn">
                    <Eye size={16} />
                    Preview
                  </button>
                </div>
              </div>

              <div className="asset-details">
                <h3 className="asset-title">{asset.name}</h3>
                <div className="asset-meta-row">
                  <span className="meta-item">
                    <Layers size={14} />
                    {asset.components?.length || 0} parts
                  </span>
                  <span className="meta-item">
                    <Tag size={14} />
                    {asset.category}
                  </span>
                </div>
                <div className="asset-meta-row">
                  <span className="meta-item">
                    <Calendar size={14} />
                    {new Date(asset.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="asset-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (asset.mesh?.glbUrl) {
                      window.open(asset.mesh.glbUrl, '_blank')
                    }
                  }}
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-library">
          <Box size={64} />
          <h2>No Assets Found</h2>
          <p>
            {assets.length === 0
              ? 'Create your first 3D asset to populate your library'
              : 'No assets match your search criteria'}
          </p>
        </div>
      )}

      {selectedAsset && (
        <div className="asset-detail-panel">
          <div className="panel-header">
            <h2>{selectedAsset.name}</h2>
            <button className="close-btn" onClick={() => setSelectedAsset(null)}>×</button>
          </div>

          <div className="panel-viewer">
            <ModelViewer
              modelUrl={selectedAsset.mesh?.glbUrl}
              parts={selectedAsset.components || []}
            />
          </div>

          <div className="panel-info">
            <div className="info-section">
              <h3>Details</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Domain</span>
                  <span className="info-value">{selectedAsset.domain}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Category</span>
                  <span className="info-value">{selectedAsset.category}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Parts</span>
                  <span className="info-value">{selectedAsset.components?.length || 0}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Triangles</span>
                  <span className="info-value">{selectedAsset.metadata?.triangleCount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {selectedAsset.components?.length > 0 && (
              <div className="info-section">
                <h3>Components</h3>
                <div className="components-list">
                  {selectedAsset.components.map((comp, index) => (
                    <div key={comp.id} className="component-item">
                      <span className="comp-index">{index + 1}</span>
                      <span className="comp-name">{comp.displayName || comp.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="panel-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (selectedAsset.mesh?.glbUrl) {
                    window.open(selectedAsset.mesh.glbUrl, '_blank')
                  }
                }}
              >
                <Download size={18} />
                Download GLB
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
