import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Environment, Center, Html, useProgress } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { Maximize2, RotateCcw, Box, Layers } from 'lucide-react'
import './ModelViewer.css'

function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="model-loader">
        <div className="loader-spinner"></div>
        <span>{progress.toFixed(0)}% loaded</span>
      </div>
    </Html>
  )
}

function Model({ url, autoRotate }) {
  const gltf = useLoader(GLTFLoader, url)
  const meshRef = useRef()

  useFrame((state, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3
    }
  })

  return (
    <Center>
      <primitive ref={meshRef} object={gltf.scene} scale={1} />
    </Center>
  )
}

function PlaceholderModel() {
  const meshRef = useRef()

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5
    }
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#0066ff" wireframe />
    </mesh>
  )
}

export function ModelViewer({ modelUrl, parts = [], onPartSelect }) {
  const [autoRotate, setAutoRotate] = useState(true)
  const [showWireframe, setShowWireframe] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handlePartClick = (part) => {
    setSelectedPart(part.id)
    onPartSelect?.(part)
  }

  return (
    <div className={`model-viewer ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="viewer-toolbar">
        <div className="toolbar-left">
          <button
            className={`toolbar-btn ${autoRotate ? 'active' : ''}`}
            onClick={() => setAutoRotate(!autoRotate)}
            title="Auto Rotate"
          >
            <RotateCcw size={18} />
          </button>
          <button
            className={`toolbar-btn ${showWireframe ? 'active' : ''}`}
            onClick={() => setShowWireframe(!showWireframe)}
            title="Wireframe"
          >
            <Box size={18} />
          </button>
        </div>
        <div className="toolbar-right">
          <button
            className="toolbar-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title="Fullscreen"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </div>

      <div className="canvas-container">
        <Canvas camera={{ position: [2, 2, 2], fov: 50 }}>
          <Suspense fallback={<Loader />}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <directionalLight position={[-10, -10, -5]} intensity={0.4} />

            {modelUrl ? (
              <Model url={modelUrl} autoRotate={autoRotate} />
            ) : (
              <PlaceholderModel />
            )}

            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              autoRotate={false}
              minDistance={1}
              maxDistance={10}
            />
            <Environment preset="city" />
          </Suspense>
        </Canvas>

        {!modelUrl && (
          <div className="placeholder-overlay">
            <Box size={48} />
            <span>3D Preview</span>
            <span className="hint">Model will appear here after generation</span>
          </div>
        )}
      </div>

      {parts.length > 0 && (
        <div className="parts-panel">
          <div className="parts-header">
            <Layers size={16} />
            <span>Components ({parts.length})</span>
          </div>
          <div className="parts-list">
            {parts.map((part, index) => (
              <button
                key={part.id}
                className={`part-item ${selectedPart === part.id ? 'selected' : ''}`}
                onClick={() => handlePartClick(part)}
              >
                <span className="part-index">{index + 1}</span>
                <span className="part-name">{part.name || part.displayName}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
