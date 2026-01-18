import { useState, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, RotateCcw } from 'lucide-react'
import './ImageUploader.css'

const VIEW_LABELS = {
  front: 'Front View',
  back: 'Back View',
  left: 'Left View',
  right: 'Right View',
  top: 'Top View',
  bottom: 'Bottom View',
  frontLeft45: '45° Front-Left',
  frontRight45: '45° Front-Right'
}

export function ImageUploader({ images, setImages, viewMode = 'single' }) {
  const [dragActive, setDragActive] = useState(false)
  const [activeView, setActiveView] = useState('front')

  const views = viewMode === 'single'
    ? ['front']
    : viewMode === '4-view'
    ? ['front', 'back', 'left', 'right']
    : ['front', 'back', 'left', 'right', 'top', 'bottom', 'frontLeft45', 'frontRight45']

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e, view = activeView) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0], view)
    }
  }, [activeView])

  const handleFile = (file, view) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImages(prev => ({
          ...prev,
          [view]: {
            file,
            preview: e.target.result
          }
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileInput = (e, view) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0], view)
    }
  }

  const removeImage = (view) => {
    setImages(prev => {
      const updated = { ...prev }
      delete updated[view]
      return updated
    })
  }

  const clearAll = () => {
    setImages({})
  }

  return (
    <div className="image-uploader">
      <div className="uploader-header">
        <h3>Reference Images</h3>
        {Object.keys(images).length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={clearAll}>
            <RotateCcw size={14} />
            Clear All
          </button>
        )}
      </div>

      {viewMode !== 'single' && (
        <div className="view-tabs">
          {views.map(view => (
            <button
              key={view}
              className={`view-tab ${activeView === view ? 'active' : ''} ${images[view] ? 'has-image' : ''}`}
              onClick={() => setActiveView(view)}
            >
              {VIEW_LABELS[view]}
              {images[view] && <span className="check">✓</span>}
            </button>
          ))}
        </div>
      )}

      <div
        className={`drop-zone ${dragActive ? 'active' : ''} ${images[activeView] ? 'has-image' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={(e) => handleDrop(e, activeView)}
      >
        {images[activeView] ? (
          <div className="image-preview">
            <img src={images[activeView].preview} alt={`${VIEW_LABELS[activeView]} preview`} />
            <button className="remove-btn" onClick={() => removeImage(activeView)}>
              <X size={16} />
            </button>
            <div className="image-info">
              <span>{images[activeView].file.name}</span>
              <span>{(images[activeView].file.size / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        ) : (
          <label className="upload-label">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileInput(e, activeView)}
              hidden
            />
            <Upload size={48} className="upload-icon" />
            <span className="upload-text">
              Drop {VIEW_LABELS[activeView]} here or <span className="link">browse</span>
            </span>
            <span className="upload-hint">PNG, JPG up to 10MB</span>
          </label>
        )}
      </div>

      {viewMode !== 'single' && (
        <div className="image-grid">
          {views.map(view => (
            <div
              key={view}
              className={`grid-thumb ${images[view] ? 'has-image' : ''} ${activeView === view ? 'active' : ''}`}
              onClick={() => setActiveView(view)}
            >
              {images[view] ? (
                <img src={images[view].preview} alt={VIEW_LABELS[view]} />
              ) : (
                <ImageIcon size={20} />
              )}
              <span className="thumb-label">{view.charAt(0).toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}

      <div className="upload-stats">
        <span>{Object.keys(images).length} / {views.length} views uploaded</span>
        {viewMode !== 'single' && Object.keys(images).length < views.length && (
          <span className="hint">More views = better 3D reconstruction</span>
        )}
      </div>
    </div>
  )
}
