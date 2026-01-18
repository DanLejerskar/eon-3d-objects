import { useState, useEffect } from 'react'
import { Key, Save, ExternalLink, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { setApiKeys, getApiKeys, hasValidKeys } from '../services/api'
import './Settings.css'

export function Settings() {
  const [falKey, setFalKey] = useState('')
  const [aimlKey, setAimlKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState({ fal: null, aiml: null })

  useEffect(() => {
    const keys = getApiKeys()
    setFalKey(keys.fal)
    setAimlKey(keys.aiml)
  }, [])

  const handleSave = () => {
    setApiKeys(falKey, aimlKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const testConnection = async (service) => {
    setTesting(true)
    setTestResults(prev => ({ ...prev, [service]: 'testing' }))

    try {
      if (service === 'fal') {
        // Test fal.ai connection
        const response = await fetch('https://fal.run/fal-ai/hunyuan3d-v3/image-to-3d', {
          method: 'OPTIONS',
          headers: {
            'Authorization': `Key ${falKey}`
          }
        })
        setTestResults(prev => ({ ...prev, fal: response.ok ? 'success' : 'error' }))
      } else {
        // Test AIML API connection
        const response = await fetch('https://api.aimlapi.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${aimlKey}`
          }
        })
        setTestResults(prev => ({ ...prev, aiml: response.ok ? 'success' : 'error' }))
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [service]: 'error' }))
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Configure API keys and application preferences</p>
      </div>

      <div className="settings-section">
        <h2>API Configuration</h2>

        <div className="api-key-card">
          <div className="key-header">
            <div className="key-info">
              <Key size={20} className="key-icon fal" />
              <div>
                <h3>fal.ai API Key</h3>
                <p>Required for Hunyuan3D mesh generation</p>
              </div>
            </div>
            <a
              href="https://fal.ai/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="get-key-link"
            >
              Get API Key
              <ExternalLink size={14} />
            </a>
          </div>

          <div className="key-input-group">
            <input
              type="password"
              placeholder="Enter your fal.ai API key"
              value={falKey}
              onChange={(e) => setFalKey(e.target.value)}
            />
            <button
              className="test-btn"
              onClick={() => testConnection('fal')}
              disabled={!falKey || testing}
            >
              {testResults.fal === 'testing' ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : testResults.fal === 'success' ? (
                <CheckCircle size={16} className="success" />
              ) : testResults.fal === 'error' ? (
                <AlertCircle size={16} className="error" />
              ) : (
                'Test'
              )}
            </button>
          </div>
        </div>

        <div className="api-key-card">
          <div className="key-header">
            <div className="key-info">
              <Key size={20} className="key-icon aiml" />
              <div>
                <h3>AIML API Key</h3>
                <p>Required for Hunyuan-Part mesh segmentation</p>
              </div>
            </div>
            <a
              href="https://aimlapi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="get-key-link"
            >
              Get API Key
              <ExternalLink size={14} />
            </a>
          </div>

          <div className="key-input-group">
            <input
              type="password"
              placeholder="Enter your AIML API key"
              value={aimlKey}
              onChange={(e) => setAimlKey(e.target.value)}
            />
            <button
              className="test-btn"
              onClick={() => testConnection('aiml')}
              disabled={!aimlKey || testing}
            >
              {testResults.aiml === 'testing' ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : testResults.aiml === 'success' ? (
                <CheckCircle size={16} className="success" />
              ) : testResults.aiml === 'error' ? (
                <AlertCircle size={16} className="error" />
              ) : (
                'Test'
              )}
            </button>
          </div>
        </div>

        <button className="btn btn-primary save-btn" onClick={handleSave}>
          <Save size={18} />
          {saved ? 'Saved!' : 'Save API Keys'}
        </button>

        {hasValidKeys() && (
          <div className="status-message success">
            <CheckCircle size={16} />
            API keys are configured. You can now generate 3D assets.
          </div>
        )}
      </div>

      <div className="settings-section">
        <h2>Quick Links</h2>

        <div className="links-grid">
          <a
            href="https://3d.hunyuan.tencent.com/studio"
            target="_blank"
            rel="noopener noreferrer"
            className="link-card"
          >
            <h3>Hunyuan 3D Studio</h3>
            <p>Interactive brush-based segmentation (free beta)</p>
            <ExternalLink size={14} />
          </a>

          <a
            href="https://fal.ai/models/fal-ai/hunyuan3d-v3/image-to-3d"
            target="_blank"
            rel="noopener noreferrer"
            className="link-card"
          >
            <h3>fal.ai Documentation</h3>
            <p>Hunyuan3D V3 API reference and pricing</p>
            <ExternalLink size={14} />
          </a>

          <a
            href="https://docs.aimlapi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="link-card"
          >
            <h3>AIML API Docs</h3>
            <p>Hunyuan-Part segmentation API reference</p>
            <ExternalLink size={14} />
          </a>

          <a
            href="https://github.com/Tencent-Hunyuan/Hunyuan3D-Part"
            target="_blank"
            rel="noopener noreferrer"
            className="link-card"
          >
            <h3>Hunyuan3D-Part GitHub</h3>
            <p>Open source segmentation model repository</p>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      <div className="settings-section">
        <h2>Pricing Reference</h2>

        <div className="pricing-table">
          <div className="pricing-row header">
            <span>Service</span>
            <span>Operation</span>
            <span>Cost</span>
          </div>
          <div className="pricing-row">
            <span>fal.ai</span>
            <span>Normal 3D (textured)</span>
            <span>$0.375</span>
          </div>
          <div className="pricing-row">
            <span>fal.ai</span>
            <span>LowPoly 3D</span>
            <span>$0.45</span>
          </div>
          <div className="pricing-row">
            <span>fal.ai</span>
            <span>Geometry (white mesh)</span>
            <span>$0.225</span>
          </div>
          <div className="pricing-row">
            <span>fal.ai</span>
            <span>PBR Materials add-on</span>
            <span>+$0.15</span>
          </div>
          <div className="pricing-row">
            <span>fal.ai</span>
            <span>Multi-view images</span>
            <span>+$0.15</span>
          </div>
          <div className="pricing-row">
            <span>AIML API</span>
            <span>Mesh segmentation</span>
            <span>~$0.15</span>
          </div>
          <div className="pricing-row total">
            <span></span>
            <span>Typical Total per Asset</span>
            <span>$1.00 - $1.20</span>
          </div>
        </div>
      </div>
    </div>
  )
}
