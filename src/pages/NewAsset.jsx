import { useState } from 'react'
import { ArrowLeft, Play, Download, ExternalLink, Info, Wand2 } from 'lucide-react'
import { ImageUploader } from '../components/ImageUploader'
import { ModelViewer } from '../components/ModelViewer'
import { PipelineStatus } from '../components/PipelineStatus'
import { runPipeline, calculateCost, hasValidKeys } from '../services/api'
import './NewAsset.css'

const CATEGORIES = [
  { value: 'pump', label: 'Pump' },
  { value: 'valve', label: 'Valve' },
  { value: 'compressor', label: 'Compressor' },
  { value: 'separator', label: 'Separator' },
  { value: 'tank', label: 'Tank' },
  { value: 'safety_device', label: 'Safety Device' },
  { value: 'piping', label: 'Piping' },
  { value: 'instrument', label: 'Instrument' }
]

const DOMAINS = [
  { value: 'oil_gas', label: 'Oil & Gas' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'healthcare', label: 'Healthcare' }
]

const SUBDOMAINS = {
  oil_gas: [
    { value: 'upstream', label: 'Upstream' },
    { value: 'midstream', label: 'Midstream' },
    { value: 'downstream', label: 'Downstream' }
  ]
}

const PROMPT_TEMPLATES = {
  pump: 'Industrial centrifugal pump, API 610 style, horizontal configuration, mounted on steel skid base, visible motor with coupling guard and pump casing with suction and discharge flanges, high detail, clean white background, neutral studio lighting, no text or logos, accurate engineering proportions',
  valve: 'Industrial gate valve, flanged ends, rising stem design, handwheel operator, cast steel body, 6-inch nominal size, high detail, clean white background, neutral studio lighting, no text or logos, accurate engineering proportions',
  compressor: 'Industrial reciprocating compressor, horizontal opposed configuration, visible cylinders with valve covers, crankcase, flywheel, and intercooler piping, mounted on concrete foundation, high detail, clean white background, neutral studio lighting',
  separator: 'Industrial three-phase separator vessel, horizontal pressure vessel with inlet diverter, weir plates, mist extractor, and multiple outlet nozzles for oil gas and water, mounted on saddle supports',
  tank: 'Vertical storage tank, cylindrical shell, cone roof, nozzles, level gauge, vent, manway, atmospheric design, clean white background, neutral studio lighting'
}

export function NewAsset({ addAsset, setCurrentPage }) {
  const [images, setImages] = useState({})
  const [viewMode, setViewMode] = useState('single')
  const [isProcessing, setIsProcessing] = useState(false)
  const [pipelineStatus, setPipelineStatus] = useState(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [generatedAsset, setGeneratedAsset] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    domain: 'oil_gas',
    subdomain: 'downstream',
    category: 'pump',
    targetTriangles: 500000,
    meshType: 'Normal',
    enablePbr: true,
    prompt: PROMPT_TEMPLATES.pump
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      if (field === 'category' && PROMPT_TEMPLATES[value]) {
        updated.prompt = PROMPT_TEMPLATES[value]
      }
      return updated
    })
  }

  const estimatedCost = calculateCost({
    type: formData.meshType,
    pbr: formData.enablePbr,
    viewCount: Object.keys(images).length
  })

  const canGenerate = Object.keys(images).length > 0 && formData.name && hasValidKeys()

  const handleGenerate = async () => {
    if (!canGenerate) return

    setIsProcessing(true)
    setError(null)
    setPipelineStatus({ stage: 'upload', progress: 0 })
    setProgress(0)

    try {
      const imageFiles = {}
      for (const [view, data] of Object.entries(images)) {
        imageFiles[view] = data.file
      }

      const asset = await runPipeline(
        {
          ...formData,
          images: imageFiles
        },
        (status) => {
          setPipelineStatus(status)
          setProgress(status.progress)
        }
      )

      setGeneratedAsset(asset)
      addAsset(asset)
    } catch (err) {
      setError(err.message)
      setPipelineStatus({ stage: 'error', message: err.message })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (generatedAsset?.mesh?.glbUrl) {
      window.open(generatedAsset.mesh.glbUrl, '_blank')
    }
  }

  return (
    <div className="new-asset">
      <div className="page-header">
        <button className="back-btn" onClick={() => setCurrentPage('dashboard')}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Create New Asset</h1>
      </div>

      <div className="new-asset-layout">
        <div className="form-section">
          <div className="form-card">
            <h2>Asset Details</h2>

            <div className="form-group">
              <label>Asset Name *</label>
              <input
                type="text"
                placeholder="e.g., API 610 Centrifugal Pump"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Domain</label>
                <select
                  value={formData.domain}
                  onChange={(e) => handleInputChange('domain', e.target.value)}
                >
                  {DOMAINS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Subdomain</label>
                <select
                  value={formData.subdomain}
                  onChange={(e) => handleInputChange('subdomain', e.target.value)}
                >
                  {(SUBDOMAINS[formData.domain] || []).map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Target Triangles</label>
                <select
                  value={formData.targetTriangles}
                  onChange={(e) => handleInputChange('targetTriangles', parseInt(e.target.value))}
                >
                  <option value={100000}>100K (Low)</option>
                  <option value={250000}>250K (Medium)</option>
                  <option value={500000}>500K (High)</option>
                  <option value={1000000}>1M (Ultra)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Mesh Type</label>
                <select
                  value={formData.meshType}
                  onChange={(e) => handleInputChange('meshType', e.target.value)}
                >
                  <option value="Normal">Normal (Textured)</option>
                  <option value="LowPoly">Low Poly</option>
                  <option value="Geometry">Geometry (White)</option>
                </select>
              </div>

              <div className="form-group">
                <label>PBR Materials</label>
                <select
                  value={formData.enablePbr}
                  onChange={(e) => handleInputChange('enablePbr', e.target.value === 'true')}
                >
                  <option value="true">Enabled (+$0.15)</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-card">
            <div className="card-header">
              <h2>Reference Images</h2>
              <div className="view-toggle">
                <button
                  className={viewMode === 'single' ? 'active' : ''}
                  onClick={() => setViewMode('single')}
                >
                  Single
                </button>
                <button
                  className={viewMode === '4-view' ? 'active' : ''}
                  onClick={() => setViewMode('4-view')}
                >
                  4-View
                </button>
                <button
                  className={viewMode === '8-view' ? 'active' : ''}
                  onClick={() => setViewMode('8-view')}
                >
                  8-View
                </button>
              </div>
            </div>

            <ImageUploader
              images={images}
              setImages={setImages}
              viewMode={viewMode}
            />
          </div>

          <div className="form-card">
            <div className="card-header">
              <h2>Prompt Template</h2>
              <button className="btn btn-secondary btn-sm">
                <Wand2 size={14} />
                Auto-generate
              </button>
            </div>
            <textarea
              value={formData.prompt}
              onChange={(e) => handleInputChange('prompt', e.target.value)}
              rows={4}
              placeholder="Describe the asset for image generation..."
            />
            <p className="form-hint">
              <Info size={14} />
              Used when generating reference images via ChatGPT/Nano Banana
            </p>
          </div>
        </div>

        <div className="preview-section">
          <div className="preview-card">
            <ModelViewer
              modelUrl={generatedAsset?.mesh?.glbUrl}
              parts={generatedAsset?.components || []}
            />
          </div>

          {(isProcessing || pipelineStatus) && (
            <PipelineStatus
              status={pipelineStatus}
              progress={progress}
              error={error}
            />
          )}

          <div className="action-card">
            <div className="cost-estimate">
              <span className="cost-label">Estimated Cost</span>
              <span className="cost-value">${estimatedCost}</span>
            </div>

            <div className="action-buttons">
              <button
                className="btn btn-primary btn-lg"
                onClick={handleGenerate}
                disabled={!canGenerate || isProcessing}
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Play size={20} />
                    Generate 3D Asset
                  </>
                )}
              </button>

              {generatedAsset && (
                <>
                  <button className="btn btn-secondary" onClick={handleDownload}>
                    <Download size={18} />
                    Download GLB
                  </button>
                  <a
                    href="https://3d.hunyuan.tencent.com/studio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    <ExternalLink size={18} />
                    Open in Studio
                  </a>
                </>
              )}
            </div>

            {!hasValidKeys() && (
              <p className="warning-text">
                <Info size={14} />
                API keys required. Configure in Settings.
              </p>
            )}
          </div>

          {generatedAsset && (
            <div className="result-card">
              <h3>Generated Asset</h3>
              <div className="result-details">
                <div className="detail-row">
                  <span>Asset ID</span>
                  <code>{generatedAsset.id.slice(0, 8)}...</code>
                </div>
                <div className="detail-row">
                  <span>Components</span>
                  <span>{generatedAsset.components?.length || 0} parts detected</span>
                </div>
                <div className="detail-row">
                  <span>File Size</span>
                  <span>{((generatedAsset.mesh?.fileSize || 0) / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div className="detail-row">
                  <span>Status</span>
                  <span className="status-badge completed">{generatedAsset.status}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
