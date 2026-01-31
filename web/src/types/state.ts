import type { Renderer } from '../../pkg/visual_algebra_core.js';
import type { LayerConfig } from './module.js';

// Complex number representation for eigenvalues
export interface Complex {
  re: number;
  im: number;
}

// 3D vector type
export type Vector3 = [number, number, number];

// Computed invariants (cached)
export interface Invariants {
  determinant: number;
  trace: number;
  rank: number;
  eigenvalues: Complex[] | null;
  eigenvectors: Float32Array[] | null;
}

// Core application state
export interface AppState {
  // Module/scene navigation
  currentModule: string | null;
  currentSceneIndex: number;

  // Rendering
  renderer: Renderer | null;
  canvas: HTMLCanvasElement | null;

  // Matrix state (supports multiple named matrices)
  matrices: Map<string, Float32Array>;
  activeMatrix: string;

  // Legacy single-matrix support (for backward compatibility)
  currentMatrix: Float32Array;
  targetMatrix: Float32Array;

  // Animation
  animationProgress: number;
  isPlaying: boolean;
  animationSpeed: number;

  // Camera (spherical coordinates)
  cameraTheta: number;
  cameraPhi: number;
  cameraDistance: number;

  // Layer visibility
  layers: Map<string, LayerConfig>;

  // Legacy visibility flags (for backward compatibility)
  showGrid: boolean;
  showCube: boolean;
  showBasis: boolean;
  showVector: boolean;

  // Eigenvalues module visibility
  showEigenspace: boolean;
  showPointCloud: boolean;
  iterationCount: number;
  eigenAnimTarget: number;
  eigenAnimProgress: number;

  // Degenerate matrices module visibility
  showNullSpace: boolean;
  showColumnSpace: boolean;
  showDegenPointCloud: boolean;

  // Affine combinations module
  affinePoints: [Vector3, Vector3, Vector3];
  affineWeights: [number, number, number];
  affineFrozen: [boolean, boolean, boolean];
  showAffineHull: boolean;
  showAffineResult: boolean;
  showAffinePoints: boolean;
  affineDimension: number;

  // Convex combinations module
  convexPoints: [Vector3, Vector3, Vector3];
  convexWeights: [number, number, number];
  convexFrozen: [boolean, boolean, boolean];
  showConvexHull: boolean;
  showConvexResult: boolean;
  showConvexPoints: boolean;

  // Complex eigenvalues module
  rotationAngle: number;
  scaleFactor: number;
  rotationAxisType: string;
  showRotationAxis: boolean;
  showRotationPlane: boolean;
  showComplexPlane: boolean;
  showSpiralTrails: boolean;

  // Vectors (supports multiple named vectors)
  vectors: Map<string, Vector3>;
  customVector: Vector3;

  // Computed invariants
  invariants: Invariants;

  // Iteration/dynamics state
  iterationTrail: Float32Array[];
  maxTrailLength: number;

  // Mouse interaction
  isDragging: boolean;
  lastMouseX: number;
  lastMouseY: number;
}

// Create default initial state
export function createInitialState(): AppState {
  return {
    // Module/scene
    currentModule: null,
    currentSceneIndex: 0,

    // Rendering
    renderer: null,
    canvas: null,

    // Matrices
    matrices: new Map([['main', new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])]]),
    activeMatrix: 'main',
    currentMatrix: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]),
    targetMatrix: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]),

    // Animation
    animationProgress: 0,
    isPlaying: false,
    animationSpeed: 1,

    // Camera
    cameraTheta: Math.PI / 4,
    cameraPhi: Math.PI / 6,
    cameraDistance: 5,

    // Layers
    layers: new Map([
      ['grid', { type: 'grid', visible: true, params: { size: 6, divisions: 24 } }],
      ['axes', { type: 'axes', visible: true, params: { length: 3 } }],
      ['basis', { type: 'basis', visible: true, params: {} }],
      ['cube', { type: 'cube', visible: true, params: {} }],
      ['vector', { type: 'vector', visible: true, params: {} }],
    ]),

    // Legacy visibility
    showGrid: true,
    showCube: true,
    showBasis: true,
    showVector: true,

    // Eigenvalues module visibility
    showEigenspace: false,
    showPointCloud: false,
    iterationCount: 0,
    eigenAnimTarget: 0,
    eigenAnimProgress: 1,

    // Degenerate matrices module visibility
    showNullSpace: false,
    showColumnSpace: false,
    showDegenPointCloud: false,

    // Affine combinations module
    affinePoints: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    affineWeights: [0.33, 0.33, 0.34],
    affineFrozen: [false, false, false],
    showAffineHull: true,
    showAffineResult: true,
    showAffinePoints: true,
    affineDimension: 3,

    // Convex combinations module
    convexPoints: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    convexWeights: [0.33, 0.33, 0.34],
    convexFrozen: [false, false, false],
    showConvexHull: true,
    showConvexResult: true,
    showConvexPoints: true,

    // Complex eigenvalues module
    rotationAngle: 45,
    scaleFactor: 1,
    rotationAxisType: 'Z',
    showRotationAxis: false,
    showRotationPlane: false,
    showComplexPlane: false,
    showSpiralTrails: false,

    // Vectors
    vectors: new Map([['input', [1, 0.5, 0.5]]]),
    customVector: [1, 0.5, 0.5],

    // Invariants
    invariants: {
      determinant: 1,
      trace: 3,
      rank: 3,
      eigenvalues: null,
      eigenvectors: null,
    },

    // Iteration
    iterationTrail: [],
    maxTrailLength: 100,

    // Mouse
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  };
}

// Type guard for checking if state has a renderer
export function hasRenderer(state: AppState): state is AppState & { renderer: Renderer; canvas: HTMLCanvasElement } {
  return state.renderer !== null && state.canvas !== null;
}
