import { CheckCircle, Circle, Loader2, AlertCircle, ChevronRight } from 'lucide-react'
import './PipelineStatus.css'

const STAGES = [
  { id: 'upload', label: 'Upload Images', description: 'Uploading reference images to processing server' },
  { id: 'mesh', label: 'Generate 3D Mesh', description: 'Creating textured 3D model with Hunyuan3D' },
  { id: 'segment', label: 'Segment Parts', description: 'Detecting and separating components with PartGen' },
  { id: 'finalize', label: 'Finalize Asset', description: 'Building final asset with metadata' }
]

export function PipelineStatus({ status, progress, message, error }) {
  const currentStageIndex = STAGES.findIndex(s => s.id === status?.stage)

  const getStageStatus = (stageIndex) => {
    if (status?.stage === 'complete') return 'completed'
    if (status?.stage === 'error') {
      if (stageIndex <= currentStageIndex) return 'error'
      return 'pending'
    }
    if (stageIndex < currentStageIndex) return 'completed'
    if (stageIndex === currentStageIndex) return 'processing'
    return 'pending'
  }

  const getStageIcon = (stageStatus) => {
    switch (stageStatus) {
      case 'completed':
        return <CheckCircle size={20} className="icon-completed" />
      case 'processing':
        return <Loader2 size={20} className="icon-processing animate-spin" />
      case 'error':
        return <AlertCircle size={20} className="icon-error" />
      default:
        return <Circle size={20} className="icon-pending" />
    }
  }

  return (
    <div className="pipeline-status">
      <div className="status-header">
        <h3>Pipeline Progress</h3>
        {status?.stage && status.stage !== 'idle' && (
          <span className={`status-badge ${status.stage === 'error' ? 'error' : status.stage === 'complete' ? 'completed' : 'processing'}`}>
            {status.stage === 'complete' ? 'Complete' : status.stage === 'error' ? 'Failed' : 'Processing'}
          </span>
        )}
      </div>

      <div className="progress-track">
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress || 0}%` }}
          />
        </div>
        <span className="progress-percent">{progress || 0}%</span>
      </div>

      <div className="stages-list">
        {STAGES.map((stage, index) => {
          const stageStatus = getStageStatus(index)
          return (
            <div key={stage.id} className={`stage-item ${stageStatus}`}>
              <div className="stage-icon">
                {getStageIcon(stageStatus)}
              </div>
              <div className="stage-content">
                <div className="stage-label">{stage.label}</div>
                <div className="stage-description">
                  {stageStatus === 'processing' && message
                    ? message
                    : stage.description}
                </div>
              </div>
              {index < STAGES.length - 1 && (
                <ChevronRight size={16} className="stage-arrow" />
              )}
            </div>
          )
        })}
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {status?.stage === 'complete' && (
        <div className="success-message">
          <CheckCircle size={16} />
          <span>Asset generated successfully!</span>
        </div>
      )}
    </div>
  )
}
