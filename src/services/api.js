// EON 3D Objects API Service
// Integrates with fal.ai Hunyuan3D and AIML API for mesh segmentation
import * as fal from '@fal-ai/client'

// Store API keys (in production, these should come from environment variables)
let apiKeys = {
  fal: localStorage.getItem('FAL_KEY') || '',
  aiml: localStorage.getItem('AIMLAPI_KEY') || ''
}

// Configure fal client when keys are set
function configureFal() {
  if (apiKeys.fal) {
    fal.config({
      credentials: apiKeys.fal
    })
  }
}

export function setApiKeys(falKey, aiml) {
  apiKeys.fal = falKey
  apiKeys.aiml = aiml
  localStorage.setItem('FAL_KEY', falKey)
  localStorage.setItem('AIMLAPI_KEY', aiml)
  configureFal()
}

export function getApiKeys() {
  return apiKeys
}

export function hasValidKeys() {
  return apiKeys.fal && apiKeys.aiml
}

// Initialize fal config on load
configureFal()

// Convert File to data URL for fal.ai
async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Generate 3D model from images using Hunyuan3D V3 via fal.ai client
export async function generateMesh(imageUrls, options = {}) {
  configureFal()

  const input = {
    image_url: imageUrls.front,
    foreground_ratio: 0.9,
    texture_size: 1024,
    target_face_num: options.faceCount || 500000,
    generate_type: options.type || 'Normal',
    enable_pbr: options.pbr !== false
  }

  // Add optional views for better reconstruction
  if (imageUrls.back) input.back_image_url = imageUrls.back
  if (imageUrls.left) input.left_image_url = imageUrls.left
  if (imageUrls.right) input.right_image_url = imageUrls.right

  try {
    const result = await fal.subscribe('fal-ai/hunyuan3d-v3/image-to-3d', {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('Generation progress:', update.logs)
        }
      }
    })

    return {
      glbUrl: result.data?.model_glb?.url || result.data?.model_urls?.glb?.url,
      objUrl: result.data?.model_urls?.obj?.url,
      thumbnail: result.data?.thumbnail?.url,
      fileSize: result.data?.model_glb?.file_size
    }
  } catch (error) {
    console.error('Mesh generation error:', error)
    throw new Error(`3D generation failed: ${error.message}`)
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

  try {
    const response = await fetch('https://api.aimlapi.com/v1/images/generations', {
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
  } catch (error) {
    console.error('Segmentation error:', error)
    // Return empty parts if segmentation fails - at least we have the mesh
    return {
      segmentedMesh: null,
      parts: [],
      partCount: 0
    }
  }
}

// Full pipeline: Image(s) → 3D Model → Segmented Parts
export async function runPipeline(assetSpec, onProgress) {
  try {
    // Stage 1: Prepare images
    onProgress?.({ stage: 'upload', progress: 0, message: 'Preparing images...' })

    const imageUrls = {}
    const imageFiles = assetSpec.images

    for (const [view, file] of Object.entries(imageFiles)) {
      if (file) {
        if (typeof file === 'string') {
          // Already a URL
          imageUrls[view] = file
        } else {
          // File object - convert to data URL for fal.ai
          const dataUrl = await fileToDataUrl(file)
          imageUrls[view] = dataUrl
        }
        onProgress?.({ stage: 'upload', progress: 20, message: `Prepared ${view} view` })
      }
    }

    // Stage 2: Generate 3D mesh
    onProgress?.({ stage: 'mesh', progress: 25, message: 'Generating 3D mesh with Hunyuan3D... (30-60 seconds)' })

    const meshResult = await generateMesh(imageUrls, {
      faceCount: assetSpec.targetTriangles || 500000,
      type: assetSpec.meshType || 'Normal',
      pbr: assetSpec.enablePbr !== false
    })

    if (!meshResult.glbUrl) {
      throw new Error('No 3D model was generated')
    }

    onProgress?.({ stage: 'mesh', progress: 55, message: '3D mesh generated successfully!' })

    // Stage 3: Segment into parts (optional - may fail)
    onProgress?.({ stage: 'segment', progress: 60, message: 'Segmenting mesh into components...' })

    let segmentResult = { parts: [], partCount: 0 }
    try {
      segmentResult = await segmentMesh(meshResult.glbUrl)
      onProgress?.({ stage: 'segment', progress: 85, message: `Detected ${segmentResult.partCount} components` })
    } catch (segError) {
      console.warn('Segmentation failed, continuing without parts:', segError)
      onProgress?.({ stage: 'segment', progress: 85, message: 'Skipped segmentation (mesh ready)' })
    }

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
    console.error('Pipeline error:', error)
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
