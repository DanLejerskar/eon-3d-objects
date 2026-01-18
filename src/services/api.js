// EON 3D Objects API Service
// Integrates with fal.ai Hunyuan3D and AIML API for mesh segmentation

const FAL_API_BASE = 'https://fal.run'
const AIML_API_BASE = 'https://api.aimlapi.com'

// Store API keys (in production, these should come from environment variables)
let apiKeys = {
  fal: localStorage.getItem('FAL_KEY') || '',
  aiml: localStorage.getItem('AIMLAPI_KEY') || ''
}

export function setApiKeys(fal, aiml) {
  apiKeys.fal = fal
  apiKeys.aiml = aiml
  localStorage.setItem('FAL_KEY', fal)
  localStorage.setItem('AIMLAPI_KEY', aiml)
}

export function getApiKeys() {
  return apiKeys
}

export function hasValidKeys() {
  return apiKeys.fal && apiKeys.aiml
}

// Upload image to fal.ai storage for processing
export async function uploadImage(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('https://fal.run/fal-ai/imageutils/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKeys.fal}`
    },
    body: formData
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`)
  }

  const data = await response.json()
  return data.url
}

// Generate 3D model from images using Hunyuan3D V3
export async function generateMesh(imageUrls, options = {}) {
  const input = {
    input_image_url: imageUrls.front,
    face_count: options.faceCount || 500000,
    generate_type: options.type || 'Normal',
    polygon_type: options.polygonType || 'triangle',
    enable_pbr: options.pbr !== false
  }

  // Add optional views for better reconstruction
  if (imageUrls.back) input.back_image_url = imageUrls.back
  if (imageUrls.left) input.left_image_url = imageUrls.left
  if (imageUrls.right) input.right_image_url = imageUrls.right

  const response = await fetch(`${FAL_API_BASE}/fal-ai/hunyuan3d-v3/image-to-3d`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKeys.fal}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(input)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`3D generation failed: ${error}`)
  }

  const result = await response.json()
  return {
    glbUrl: result.model_glb?.url || result.model_urls?.glb?.url,
    objUrl: result.model_urls?.obj?.url,
    thumbnail: result.thumbnail?.url,
    fileSize: result.model_glb?.file_size
  }
}

// Segment mesh into components using AIML API (Hunyuan-Part)
export async function segmentMesh(meshUrl, options = {}) {
  const payload = {
    model: 'tencent/hunyuan-part',
    mesh_url: meshUrl
  }

  // Add optional point prompts for guided segmentation
  if (options.pointPrompt) {
    payload.point_prompt_x = options.pointPrompt.x
    payload.point_prompt_y = options.pointPrompt.y
    payload.point_prompt_z = options.pointPrompt.z
  }

  if (options.seed) {
    payload.seed = options.seed
  }

  const response = await fetch(`${AIML_API_BASE}/v1/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKeys.aiml}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Segmentation failed: ${error}`)
  }

  const result = await response.json()

  // Parse parts from response
  const parts = []
  for (const [key, value] of Object.entries(result)) {
    if (key.startsWith('mask_') && key.endsWith('_mesh')) {
      parts.push({
        id: key.replace('_mesh', ''),
        name: `Part ${parts.length + 1}`,
        url: value.url,
        fileName: value.file_name,
        fileSize: value.file_size
      })
    }
  }

  return {
    segmentedMesh: result.segmented_mesh,
    parts,
    partCount: parts.length
  }
}

// Full pipeline: Image(s) → 3D Model → Segmented Parts
export async function runPipeline(assetSpec, onProgress) {
  const stages = [
    { id: 'upload', label: 'Uploading Images', progress: 0 },
    { id: 'mesh', label: 'Generating 3D Mesh', progress: 25 },
    { id: 'segment', label: 'Segmenting Components', progress: 60 },
    { id: 'finalize', label: 'Finalizing Asset', progress: 90 }
  ]

  try {
    // Stage 1: Upload images
    onProgress?.({ stage: 'upload', progress: 0, message: 'Uploading images...' })

    const imageUrls = {}
    const imageFiles = assetSpec.images

    for (const [view, file] of Object.entries(imageFiles)) {
      if (file) {
        if (typeof file === 'string') {
          // Already a URL
          imageUrls[view] = file
        } else {
          // File object - upload it
          const url = await uploadImage(file)
          imageUrls[view] = url
        }
        onProgress?.({ stage: 'upload', progress: 20, message: `Uploaded ${view} view` })
      }
    }

    // Stage 2: Generate 3D mesh
    onProgress?.({ stage: 'mesh', progress: 25, message: 'Generating 3D mesh with Hunyuan3D...' })

    const meshResult = await generateMesh(imageUrls, {
      faceCount: assetSpec.targetTriangles || 500000,
      type: assetSpec.meshType || 'Normal',
      pbr: assetSpec.enablePbr !== false
    })

    onProgress?.({ stage: 'mesh', progress: 55, message: '3D mesh generated successfully' })

    // Stage 3: Segment into parts
    onProgress?.({ stage: 'segment', progress: 60, message: 'Segmenting mesh into components...' })

    const segmentResult = await segmentMesh(meshResult.glbUrl)

    onProgress?.({ stage: 'segment', progress: 85, message: `Detected ${segmentResult.partCount} components` })

    // Stage 4: Finalize
    onProgress?.({ stage: 'finalize', progress: 90, message: 'Finalizing asset...' })

    const asset = {
      id: crypto.randomUUID(),
      name: assetSpec.name,
      domain: assetSpec.domain || 'oil_gas',
      category: assetSpec.category || 'pump',
      status: 'completed',
      createdAt: new Date().toISOString(),
      mesh: meshResult,
      segmentation: segmentResult,
      components: segmentResult.parts.map((part, index) => ({
        ...part,
        displayName: assetSpec.components?.[index]?.displayName || part.name,
        description: assetSpec.components?.[index]?.description || '',
        interactionFlags: assetSpec.components?.[index]?.interactionFlags || ['highlightable']
      })),
      metadata: {
        imageProvider: 'user_upload',
        meshProvider: 'fal.ai/hunyuan3d-v3',
        segmentationProvider: 'aimlapi/hunyuan-part',
        triangleCount: assetSpec.targetTriangles || 500000,
        partCount: segmentResult.partCount
      }
    }

    onProgress?.({ stage: 'complete', progress: 100, message: 'Asset created successfully!' })

    return asset

  } catch (error) {
    onProgress?.({ stage: 'error', progress: 0, message: error.message })
    throw error
  }
}

// Pricing calculator based on spec
export function calculateCost(options = {}) {
  let cost = 0

  // Base 3D generation
  const typesCosts = {
    'Normal': 0.375,
    'LowPoly': 0.45,
    'Geometry': 0.225
  }
  cost += typesCosts[options.type || 'Normal']

  // PBR materials
  if (options.pbr !== false) {
    cost += 0.15
  }

  // Multi-view bonus
  const viewCount = options.viewCount || 1
  if (viewCount > 1) {
    cost += 0.15
  }

  // Segmentation (estimated)
  cost += 0.15

  return cost.toFixed(2)
}
