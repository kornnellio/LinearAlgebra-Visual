import init, {
  Renderer,
  perspective,
  look_at,
  mat3_to_mat4,
  lerp_matrix3,
  identity3,
  determinant3,
  generate_grid,
  generate_basis_vectors,
  rotation_x,
  rotation_y,
  rotation_z,
  scale,
  shear_xy,
  // New eigen and dynamics functions
  rank_3x3,
  eigenvalues_3x3,
  eigenvectors_3x3,
  is_diagonalizable,
  iterate_vector,
  power_method_step,
  spectral_radius,
  // Null space for degenerate matrices
  null_space_3x3,
} from '../pkg/visual_algebra_core.js';

import { setupControls, getMatrixFromInputs, setMatrixToInputs, updateDeterminant, updateResultVector, setOnMatrixChange } from './controls.js';
import { registry } from './modules/index.js';

interface AppState {
  renderer: Renderer | null;
  canvas: HTMLCanvasElement | null;
  currentMatrix: Float32Array;
  targetMatrix: Float32Array;
  animationProgress: number;
  isPlaying: boolean;
  animationSpeed: number;
  cameraTheta: number;
  cameraPhi: number;
  cameraDistance: number;
  showGrid: boolean;
  showSphere: boolean;
  showBasis: boolean;
  showVector: boolean;
  showEigenspace: boolean;
  showPointCloud: boolean;
  customVector: [number, number, number];
  isDragging: boolean;
  lastMouseX: number;
  lastMouseY: number;
  // Module navigation
  currentModule: string;
  // Iteration visualization (eigenvalues module)
  iterationCount: number;
  pointCloud: number[][]; // Starting vectors for iteration
  // Eigenvector animation
  eigenAnimTarget: number; // Target iteration count for animation
  eigenAnimProgress: number; // 0-1 progress toward target
  // Degenerate matrices module
  showNullSpace: boolean;
  showColumnSpace: boolean;
  showDegenPointCloud: boolean;
  // Affine combinations module
  affinePoints: [[number, number, number], [number, number, number], [number, number, number]];
  affineWeights: [number, number, number];
  affineFrozen: [boolean, boolean, boolean];
  showAffineHull: boolean;
  showAffineResult: boolean;
  showAffinePoints: boolean;
  affineDimension: number;
  // Convex combinations module
  convexPoints: [[number, number, number], [number, number, number], [number, number, number]];
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
  spiralTime: number; // Animation time for spirals
}

// Generate a cloud of starting points (on unit sphere) - must be before state init
function generatePointCloud(): number[][] {
  const points: number[][] = [];

  // Multiple latitude rings - more points
  const latitudes = [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75]; // degrees
  const pointsPerRing = 16;

  for (const latDeg of latitudes) {
    const phi = (latDeg * Math.PI) / 180;
    const ringPoints = Math.max(8, Math.floor(pointsPerRing * Math.cos(phi)));

    for (let i = 0; i < ringPoints; i++) {
      const theta = (i / ringPoints) * Math.PI * 2;
      points.push([
        Math.cos(theta) * Math.cos(phi),
        Math.sin(phi),
        Math.sin(theta) * Math.cos(phi),
      ]);
    }
  }

  // Add poles
  points.push([0, 1, 0]);
  points.push([0, -1, 0]);

  return points;
}

const state: AppState = {
  renderer: null,
  canvas: null,
  currentMatrix: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]),
  targetMatrix: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]),
  animationProgress: 0,
  isPlaying: false,
  animationSpeed: 1,
  cameraTheta: Math.PI / 4,
  cameraPhi: Math.PI / 6,
  cameraDistance: 5,
  showGrid: false,
  showSphere: true,
  showBasis: true,
  showVector: true,
  showEigenspace: false, // Only for eigenvalues module
  showPointCloud: false, // Only for eigenvalues module
  customVector: [1, 0.5, 0.5],
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
  // Module navigation
  currentModule: 'matrices-as-maps',
  // Iteration (eigenvalues module)
  iterationCount: 0,
  pointCloud: generatePointCloud(),
  // Eigenvector animation
  eigenAnimTarget: 0,
  eigenAnimProgress: 1,
  // Degenerate matrices module
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
  showRotationAxis: true,
  showRotationPlane: true,
  showComplexPlane: false,
  showSpiralTrails: false,
  spiralTime: 0,
};

async function main() {
  await init();

  const canvas = document.getElementById('gl-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }

  state.canvas = canvas;
  resizeCanvas();

  try {
    state.renderer = new Renderer('gl-canvas');
  } catch (e) {
    console.error('Failed to create renderer:', e);
    return;
  }

  setupEventListeners();
  setupControls(state, applyPreset);
  setupModuleNavigation();

  // Connect matrix change to invariants update
  setOnMatrixChange(updateInvariants);

  updateInvariants(state.targetMatrix);

  requestAnimationFrame(render);
}

function resizeCanvas() {
  if (!state.canvas) return;
  const rect = state.canvas.parentElement!.getBoundingClientRect();
  state.canvas.width = rect.width * window.devicePixelRatio;
  state.canvas.height = rect.height * window.devicePixelRatio;
  state.renderer?.resize(state.canvas.width, state.canvas.height);
}

function setupEventListeners() {
  window.addEventListener('resize', resizeCanvas);

  const canvas = state.canvas!;

  canvas.addEventListener('mousedown', (e) => {
    state.isDragging = true;
    state.lastMouseX = e.clientX;
    state.lastMouseY = e.clientY;
    canvas.style.cursor = 'grabbing';
  });

  window.addEventListener('mouseup', () => {
    state.isDragging = false;
    canvas.style.cursor = 'grab';
  });

  window.addEventListener('mousemove', (e) => {
    if (!state.isDragging) return;
    const dx = e.clientX - state.lastMouseX;
    const dy = e.clientY - state.lastMouseY;
    state.cameraTheta -= dx * 0.01;
    state.cameraPhi = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, state.cameraPhi + dy * 0.01));
    state.lastMouseX = e.clientX;
    state.lastMouseY = e.clientY;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    state.cameraDistance = Math.max(2, Math.min(15, state.cameraDistance + e.deltaY * 0.01));
  });

  canvas.style.cursor = 'grab';
}

// Multiply two 3x3 matrices (column-major order): result = a * b
function multiplyMatrix3(a: number[], b: Float32Array): Float32Array {
  const result = new Float32Array(9);
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 3; row++) {
      result[col * 3 + row] =
        a[0 * 3 + row] * b[col * 3 + 0] +
        a[1 * 3 + row] * b[col * 3 + 1] +
        a[2 * 3 + row] * b[col * 3 + 2];
    }
  }
  return result;
}

// Generate a unit sphere with meridians and parallels
function generateSphere(meridians: number = 12, parallels: number = 8): Float32Array {
  const vertices: number[] = [];

  // Generate parallels (horizontal circles at different latitudes)
  for (let i = 1; i < parallels; i++) {
    const phi = (i / parallels) * Math.PI; // latitude from 0 to PI
    const y = Math.cos(phi);
    const r = Math.sin(phi); // radius at this latitude

    // Draw circle at this latitude
    const segments = meridians * 2;
    for (let j = 0; j <= segments; j++) {
      const theta1 = (j / segments) * Math.PI * 2;
      const theta2 = ((j + 1) / segments) * Math.PI * 2;

      vertices.push(
        r * Math.cos(theta1), y, r * Math.sin(theta1),
        r * Math.cos(theta2), y, r * Math.sin(theta2)
      );
    }
  }

  // Generate meridians (vertical great circles)
  for (let i = 0; i < meridians; i++) {
    const theta = (i / meridians) * Math.PI * 2;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    // Draw arc from pole to pole
    const segments = parallels * 2;
    for (let j = 0; j < segments; j++) {
      const phi1 = (j / segments) * Math.PI;
      const phi2 = ((j + 1) / segments) * Math.PI;

      vertices.push(
        Math.sin(phi1) * cosTheta, Math.cos(phi1), Math.sin(phi1) * sinTheta,
        Math.sin(phi2) * cosTheta, Math.cos(phi2), Math.sin(phi2) * sinTheta
      );
    }
  }

  return new Float32Array(vertices);
}

function applyPreset(preset: string) {
  const angle = Math.PI / 4;
  let matrix: number[];
  let chainable = true; // Whether to multiply with current matrix

  switch (preset) {
    case 'identity':
      matrix = Array.from(identity3());
      chainable = false; // Identity resets
      break;
    case 'rotateX':
      matrix = Array.from(rotation_x(angle));
      break;
    case 'rotateY':
      matrix = Array.from(rotation_y(angle));
      break;
    case 'rotateZ':
      matrix = Array.from(rotation_z(angle));
      break;
    case 'scale':
      matrix = Array.from(scale(2, 2, 2));
      break;
    case 'shear':
      matrix = Array.from(shear_xy(0.5, 0.3));
      break;
    case 'reflect':
      matrix = [1, 0, 0, 0, 1, 0, 0, 0, -1]; // Reflect across XY plane
      break;
    case 'project':
      matrix = [1, 0, 0, 0, 1, 0, 0, 0, 0]; // Project onto XY plane
      break;
    // Degenerate matrix presets
    case 'rank2-xy':
      matrix = [1, 0, 0, 0, 1, 0, 0, 0, 0]; // Project onto XY plane (rank 2)
      chainable = false;
      break;
    case 'rank2-xz':
      matrix = [1, 0, 0, 0, 0, 0, 0, 0, 1]; // Project onto XZ plane (rank 2)
      chainable = false;
      break;
    case 'rank1-x':
      matrix = [1, 0, 0, 0, 0, 0, 0, 0, 0]; // Project onto X axis (rank 1)
      chainable = false;
      break;
    case 'rank0':
      matrix = [0, 0, 0, 0, 0, 0, 0, 0, 0]; // Zero matrix (rank 0)
      chainable = false;
      break;
    case 'rank3':
      matrix = Array.from(identity3()); // Full rank identity
      chainable = false;
      break;
    default:
      matrix = Array.from(identity3());
      chainable = false;
  }

  // Chain transformations: new = preset * current (apply preset after current)
  const newMatrix = chainable
    ? multiplyMatrix3(matrix, state.targetMatrix)
    : new Float32Array(matrix);

  state.targetMatrix = newMatrix;
  state.currentMatrix = new Float32Array(newMatrix);
  state.animationProgress = 1;
  setMatrixToInputs(state.targetMatrix);
  updateDeterminant(state.targetMatrix);
  updateInvariants(state.targetMatrix);
}

// Module navigation - dropdown menu in upper-left of canvas
function setupModuleNavigation() {
  const dropdown = document.getElementById('module-dropdown');
  const toggle = document.getElementById('dropdown-toggle');
  const menuItems = document.querySelectorAll<HTMLButtonElement>('.dropdown-item');
  const currentLabel = document.getElementById('current-module-label');

  // Toggle dropdown on click
  toggle?.addEventListener('click', () => {
    dropdown?.classList.toggle('open');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdown?.contains(e.target as Node)) {
      dropdown?.classList.remove('open');
    }
  });

  // Handle menu item clicks
  menuItems.forEach((item) => {
    item.addEventListener('click', () => {
      const moduleId = item.dataset.module;
      if (!moduleId) return;

      // Update active state
      menuItems.forEach((i) => i.classList.remove('active'));
      item.classList.add('active');

      // Update label
      if (currentLabel) {
        currentLabel.textContent = item.textContent;
      }

      // Close dropdown
      dropdown?.classList.remove('open');

      // Switch module
      state.currentModule = moduleId;
      updateModuleUI();
    });
  });

  // Initial setup
  updateModuleUI();
}

function updateModuleUI() {
  // Show/hide sections based on module (only sections in .controls, not navbar buttons)
  const sections = document.querySelectorAll<HTMLElement>('.controls [data-module]');
  sections.forEach((section) => {
    const sectionModule = section.dataset.module;
    section.style.display = sectionModule === state.currentModule ? '' : 'none';
  });

  // Reset module-specific state when switching
  if (state.currentModule === 'eigenvalues') {
    state.showEigenspace = true;
    state.showPointCloud = true;
    state.showVector = false;
    state.showSphere = false;
    state.showNullSpace = false;
    state.showColumnSpace = false;
    // Update eigenvector display when switching to this module
    updateInvariants(state.targetMatrix);
  } else if (state.currentModule === 'matrices-as-maps') {
    state.showEigenspace = false;
    state.showPointCloud = false;
    state.showDegenPointCloud = false;
    state.showVector = true;
    state.showSphere = true;
    state.showBasis = true;
    state.showNullSpace = false;
    state.showColumnSpace = false;
  } else if (state.currentModule === 'degenerate-matrices') {
    state.showEigenspace = false;
    state.showPointCloud = false;
    state.showVector = false;
    state.showSphere = false;
    state.showBasis = true;
    state.showNullSpace = true;
    state.showColumnSpace = true;
    state.showDegenPointCloud = true;
    // Update degenerate matrix display
    updateDegenerateInvariants(state.targetMatrix);
  } else if (state.currentModule === 'affine-combinations') {
    state.showEigenspace = false;
    state.showPointCloud = false;
    state.showDegenPointCloud = false;
    state.showVector = false;
    state.showSphere = false;
    state.showBasis = false;
    state.showNullSpace = false;
    state.showColumnSpace = false;
    state.showAffineHull = true;
    state.showAffineResult = true;
    state.showAffinePoints = true;
  } else if (state.currentModule === 'convex-combinations') {
    state.showEigenspace = false;
    state.showPointCloud = false;
    state.showDegenPointCloud = false;
    state.showVector = false;
    state.showSphere = false;
    state.showBasis = false;
    state.showNullSpace = false;
    state.showColumnSpace = false;
    state.showAffineHull = false;
    state.showAffineResult = false;
    state.showAffinePoints = false;
    state.showConvexHull = true;
    state.showConvexResult = true;
    state.showConvexPoints = true;
  } else if (state.currentModule === 'complex-eigenvalues') {
    state.showEigenspace = false;
    state.showPointCloud = false;
    state.showDegenPointCloud = false;
    state.showVector = false;
    state.showSphere = false;
    state.showBasis = false;
    state.showNullSpace = false;
    state.showColumnSpace = false;
    state.showAffineHull = false;
    state.showAffineResult = false;
    state.showAffinePoints = false;
    state.showConvexHull = false;
    state.showConvexResult = false;
    state.showConvexPoints = false;
    state.showRotationAxis = true;
    state.showRotationPlane = true;
    state.showGrid = true;
  }

  // Hide/show axis labels based on module
  const axisLabels = document.querySelector('.axis-labels') as HTMLElement;
  if (axisLabels) {
    const hideAxisLabels = state.currentModule === 'affine-combinations' || state.currentModule === 'convex-combinations' || state.currentModule === 'complex-eigenvalues';
    axisLabels.style.display = hideAxisLabels ? 'none' : '';
  }

  // Hide/show matrix section based on module
  const matrixSection = document.querySelector('.matrix-section') as HTMLElement;
  if (matrixSection) {
    const hideMatrix = state.currentModule === 'affine-combinations' || state.currentModule === 'convex-combinations' || state.currentModule === 'complex-eigenvalues';
    matrixSection.style.display = hideMatrix ? 'none' : '';
  }

  // Show/hide point labels for affine/convex module
  const pointLabels = document.querySelector('.point-labels') as HTMLElement;
  if (pointLabels) {
    const isAffineOrConvex = state.currentModule === 'affine-combinations' || state.currentModule === 'convex-combinations';
    pointLabels.style.display = isAffineOrConvex ? '' : 'none';
  }
}


// Update invariants display
function updateInvariants(matrix: Float32Array) {
  const matrixArray = Array.from(matrix);

  // Rank
  const rank = rank_3x3(matrixArray);
  const rankEl = document.getElementById('rank-value');
  if (rankEl) rankEl.textContent = rank.toString();

  // Eigenvalues
  const eigenvals = eigenvalues_3x3(matrixArray);
  const eigenEl = document.getElementById('eigenvalues-value');
  if (eigenEl) {
    const formatted = formatEigenvalues(eigenvals);
    eigenEl.textContent = formatted;
  }

  // Eigenvectors
  const eigenvecs = eigenvectors_3x3(matrixArray);
  for (let i = 0; i < 3; i++) {
    const evecEl = document.getElementById(`evec-${i + 1}`);
    if (evecEl) {
      const vx = eigenvecs[i * 3];
      const vy = eigenvecs[i * 3 + 1];
      const vz = eigenvecs[i * 3 + 2];
      const im = eigenvals[i * 2 + 1];

      // Check if eigenvalue is complex (no real eigenvector)
      if (Math.abs(im) > 1e-6) {
        evecEl.textContent = `v${i + 1}: complex`;
        evecEl.style.opacity = '0.5';
      } else {
        evecEl.textContent = `v${i + 1}: (${vx.toFixed(2)}, ${vy.toFixed(2)}, ${vz.toFixed(2)})`;
        evecEl.style.opacity = '1';
      }
    }
  }

  // Also update degenerate invariants if in that module
  if (state.currentModule === 'degenerate-matrices') {
    updateDegenerateInvariants(matrix);
  }
}

// Format eigenvalues for display
function formatEigenvalues(eigenvals: number[]): string {
  const results: string[] = [];

  for (let i = 0; i < 3; i++) {
    const re = eigenvals[i * 2];
    const im = eigenvals[i * 2 + 1];

    if (Math.abs(im) < 1e-6) {
      // Real eigenvalue
      results.push(re.toFixed(2));
    } else {
      // Complex eigenvalue
      const sign = im >= 0 ? '+' : '-';
      results.push(`${re.toFixed(1)}${sign}${Math.abs(im).toFixed(1)}i`);
    }
  }

  return results.join(', ');
}

// Update degenerate matrix invariants display
function updateDegenerateInvariants(matrix: Float32Array) {
  // Rank
  const rank = rank_3x3(matrix);
  const rankEl = document.getElementById('degen-rank-value');
  if (rankEl) {
    rankEl.textContent = rank.toString();
    // Color code: green for full rank, yellow for rank 2, orange for rank 1, red for rank 0
    if (rank === 3) rankEl.style.color = '#4ade80';
    else if (rank === 2) rankEl.style.color = '#fbbf24';
    else if (rank === 1) rankEl.style.color = '#fb923c';
    else rankEl.style.color = '#f87171';
  }

  // Nullity
  const nullity = 3 - rank;
  const nullityEl = document.getElementById('degen-nullity-value');
  if (nullityEl) {
    nullityEl.textContent = nullity.toString();
    // Color code inversely
    if (nullity === 0) nullityEl.style.color = '#4ade80';
    else if (nullity === 1) nullityEl.style.color = '#fbbf24';
    else if (nullity === 2) nullityEl.style.color = '#fb923c';
    else nullityEl.style.color = '#f87171';
  }

  // Null space basis vectors
  const nullBasis = null_space_3x3(matrix);
  for (let i = 0; i < 3; i++) {
    const basisEl = document.getElementById(`null-basis-${i + 1}`);
    if (basisEl) {
      const vx = nullBasis[i * 3];
      const vy = nullBasis[i * 3 + 1];
      const vz = nullBasis[i * 3 + 2];
      const len = Math.sqrt(vx * vx + vy * vy + vz * vz);

      if (len > 1e-6 && i < nullity) {
        basisEl.textContent = `n${i + 1}: (${vx.toFixed(2)}, ${vy.toFixed(2)}, ${vz.toFixed(2)})`;
        basisEl.style.opacity = '1';
      } else {
        basisEl.textContent = '-';
        basisEl.style.opacity = '0.3';
      }
    }
  }
}

// Draw null space visualization
function drawNullSpace(renderer: Renderer, matrix: Float32Array) {
  const rank = rank_3x3(matrix);
  const nullity = 3 - rank;

  console.log('drawNullSpace: rank=', rank, 'nullity=', nullity, 'matrix=', Array.from(matrix));

  if (nullity === 0) return;

  const nullBasis = null_space_3x3(matrix);
  console.log('nullBasis=', Array.from(nullBasis));

  // Purple color for null space
  const nullColor = [0.7, 0.3, 0.9];

  for (let i = 0; i < nullity; i++) {
    const vx = nullBasis[i * 3];
    const vy = nullBasis[i * 3 + 1];
    const vz = nullBasis[i * 3 + 2];
    const len = Math.sqrt(vx * vx + vy * vy + vz * vz);

    if (len < 1e-6) continue;

    // Draw null space direction as a line through origin
    const scale = 3.0;
    const positions = new Float32Array([
      -vx * scale, -vy * scale, -vz * scale,
      vx * scale, vy * scale, vz * scale,
    ]);
    const colors = new Float32Array([
      nullColor[0], nullColor[1], nullColor[2],
      nullColor[0], nullColor[1], nullColor[2],
    ]);
    renderer.draw_lines(positions, colors);

    // Draw endpoint markers
    renderer.draw_points(
      new Float32Array([vx * scale, vy * scale, vz * scale]),
      new Float32Array(nullColor)
    );
    renderer.draw_points(
      new Float32Array([-vx * scale, -vy * scale, -vz * scale]),
      new Float32Array(nullColor)
    );
  }
}

// Draw column space (image) visualization
function drawColumnSpace(renderer: Renderer, matrix: Float32Array) {
  const rank = rank_3x3(matrix);

  if (rank === 0) return;

  // Get columns of the matrix (these span the column space)
  const col0 = [matrix[0], matrix[1], matrix[2]];
  const col1 = [matrix[3], matrix[4], matrix[5]];
  const col2 = [matrix[6], matrix[7], matrix[8]];

  // Teal color for column space
  const colColor = [0.2, 0.8, 0.7];

  // Draw column vectors from origin
  const drawColumnVector = (col: number[], alpha: number) => {
    const len = Math.sqrt(col[0] * col[0] + col[1] * col[1] + col[2] * col[2]);
    if (len < 1e-6) return;

    const positions = new Float32Array([0, 0, 0, col[0], col[1], col[2]]);
    const colors = new Float32Array([
      colColor[0] * alpha, colColor[1] * alpha, colColor[2] * alpha,
      colColor[0], colColor[1], colColor[2],
    ]);
    renderer.draw_lines(positions, colors);
    renderer.draw_points(
      new Float32Array(col),
      new Float32Array(colColor)
    );
  };

  drawColumnVector(col0, 0.5);
  drawColumnVector(col1, 0.5);
  drawColumnVector(col2, 0.5);
}

// Draw point cloud for degenerate module - shows sphere being transformed
function drawDegenPointCloud(renderer: Renderer, matrix: Float32Array, points: number[][]) {
  // Color for original points (dim)
  const origColor = [0.3, 0.3, 0.4];
  // Color for transformed points (brighter, gradient based on position)
  const transColors = [
    [0.4, 0.7, 0.4],  // Green-ish
    [0.4, 0.5, 0.7],  // Blue-ish
    [0.7, 0.5, 0.4],  // Orange-ish
  ];

  for (let p = 0; p < points.length; p++) {
    const point = points[p];

    // Draw original point (on unit sphere) - dim
    renderer.draw_points(
      new Float32Array(point),
      new Float32Array([origColor[0], origColor[1], origColor[2]])
    );

    // Transform the point
    const transformed = applyMatrix(matrix, point);

    // Pick color based on point index
    const color = transColors[p % transColors.length];

    // Draw transformed point
    renderer.draw_points(
      new Float32Array(transformed),
      new Float32Array([color[0], color[1], color[2]])
    );

    // Draw line connecting original to transformed
    const lineColor = [color[0] * 0.5, color[1] * 0.5, color[2] * 0.5];
    renderer.draw_lines(
      new Float32Array([...point, ...transformed]),
      new Float32Array([...lineColor, ...lineColor])
    );
  }
}

// Apply matrix to a point
function applyMatrix(matrix: Float32Array, v: number[]): number[] {
  return [
    matrix[0] * v[0] + matrix[3] * v[1] + matrix[6] * v[2],
    matrix[1] * v[0] + matrix[4] * v[1] + matrix[7] * v[2],
    matrix[2] * v[0] + matrix[5] * v[1] + matrix[8] * v[2],
  ];
}

// ==================== AFFINE COMBINATIONS RENDERING ====================

// Draw the 4 source points for affine combinations
function drawAffineSourcePoints(renderer: Renderer, points: [[number, number, number], [number, number, number], [number, number, number]]) {
  const colors = [
    [0.97, 0.44, 0.44],  // Red - P1
    [0.29, 0.87, 0.50],  // Green - P2
    [0.38, 0.65, 0.98],  // Blue - P3
  ];

  for (let i = 0; i < 3; i++) {
    renderer.draw_points(
      new Float32Array(points[i]),
      new Float32Array(colors[i])
    );
  }
}

// Draw the affine hull based on dimension
function drawAffineHull(renderer: Renderer, points: [[number, number, number], [number, number, number], [number, number, number]], dimension: number) {
  const [p1, p2, p3] = points;
  const hullColor = [0.2, 0.7, 0.65];
  const alpha = 0.4;

  if (dimension === 0) {
    // Single point - already drawn by drawAffineSourcePoints
    return;
  } else if (dimension === 1) {
    // Line - draw extended line through collinear points
    // Find non-zero direction
    let dir = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
    let len = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1] + dir[2] * dir[2]);
    if (len < 1e-6) {
      dir = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
      len = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1] + dir[2] * dir[2]);
    }
    if (len > 1e-6) {
      dir = [dir[0] / len, dir[1] / len, dir[2] / len];
      const extend = 3.0;
      const center = [(p1[0] + p2[0] + p3[0]) / 3, (p1[1] + p2[1] + p3[1]) / 3, (p1[2] + p2[2] + p3[2]) / 3];
      const lineStart = [center[0] - dir[0] * extend, center[1] - dir[1] * extend, center[2] - dir[2] * extend];
      const lineEnd = [center[0] + dir[0] * extend, center[1] + dir[1] * extend, center[2] + dir[2] * extend];
      renderer.draw_lines(
        new Float32Array([...lineStart, ...lineEnd]),
        new Float32Array([hullColor[0] * alpha, hullColor[1] * alpha, hullColor[2] * alpha, hullColor[0] * alpha, hullColor[1] * alpha, hullColor[2] * alpha])
      );
    }
  } else {
    // Triangle (dim 2) - draw 3 edges
    const edges: [number[], number[]][] = [[p1, p2], [p1, p3], [p2, p3]];
    for (const [a, b] of edges) {
      renderer.draw_lines(
        new Float32Array([...a, ...b]),
        new Float32Array([hullColor[0] * alpha, hullColor[1] * alpha, hullColor[2] * alpha, hullColor[0] * alpha, hullColor[1] * alpha, hullColor[2] * alpha])
      );
    }
  }
}

// Draw the affine combination result point and connections
function drawAffineResult(renderer: Renderer, points: [[number, number, number], [number, number, number], [number, number, number]], weights: [number, number, number]) {
  // Compute R = w1*P1 + w2*P2 + w3*P3
  const result: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    result[0] += weights[i] * points[i][0];
    result[1] += weights[i] * points[i][1];
    result[2] += weights[i] * points[i][2];
  }

  // Point colors
  const colors = [
    [0.97, 0.44, 0.44],  // Red - P1
    [0.29, 0.87, 0.50],  // Green - P2
    [0.38, 0.65, 0.98],  // Blue - P3
  ];

  // Draw connection lines from each point to result (with weight-based alpha)
  for (let i = 0; i < 3; i++) {
    const alpha = Math.min(1, Math.abs(weights[i]) * 0.8);
    if (alpha > 0.05) {
      const color = colors[i];
      renderer.draw_lines(
        new Float32Array([...points[i], ...result]),
        new Float32Array([color[0] * alpha, color[1] * alpha, color[2] * alpha, 1.0, 1.0, 1.0])
      );
    }
  }

  // Draw result point (white)
  renderer.draw_points(
    new Float32Array(result),
    new Float32Array([1.0, 1.0, 1.0])
  );
}

// ==================== END AFFINE COMBINATIONS ====================

// ==================== CONVEX COMBINATIONS ====================

// Draw the convex hull (triangle) for 3 points
function drawConvexHull(renderer: Renderer, points: [[number, number, number], [number, number, number], [number, number, number]]) {
  const [p1, p2, p3] = points;
  const hullColor = [0.5, 0.9, 0.5]; // Brighter green for convex hull
  const alpha = 0.85;

  // Draw triangle edges
  const edges: [number[], number[]][] = [[p1, p2], [p1, p3], [p2, p3]];
  for (const [a, b] of edges) {
    renderer.draw_lines(
      new Float32Array([...a, ...b]),
      new Float32Array([hullColor[0] * alpha, hullColor[1] * alpha, hullColor[2] * alpha, hullColor[0] * alpha, hullColor[1] * alpha, hullColor[2] * alpha])
    );
  }

  // Draw filled triangle using multiple line strips for shading effect
  const steps = 12;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    // Interpolate along edges and draw connecting lines
    const p12 = [
      p1[0] + t * (p2[0] - p1[0]),
      p1[1] + t * (p2[1] - p1[1]),
      p1[2] + t * (p2[2] - p1[2]),
    ];
    const p13 = [
      p1[0] + t * (p3[0] - p1[0]),
      p1[1] + t * (p3[1] - p1[1]),
      p1[2] + t * (p3[2] - p1[2]),
    ];
    const fillAlpha = alpha * 0.45;
    renderer.draw_lines(
      new Float32Array([...p12, ...p13]),
      new Float32Array([hullColor[0] * fillAlpha, hullColor[1] * fillAlpha, hullColor[2] * fillAlpha, hullColor[0] * fillAlpha, hullColor[1] * fillAlpha, hullColor[2] * fillAlpha])
    );
  }
}

// ==================== END CONVEX COMBINATIONS ====================

// ==================== COMPLEX EIGENVALUES ====================

// Get rotation axis vector based on type
function getRotationAxis(axisType: string): [number, number, number] {
  switch (axisType) {
    case 'X': return [1, 0, 0];
    case 'Y': return [0, 1, 0];
    case 'Z': return [0, 0, 1];
    default: return [0, 0, 1];
  }
}

// Create rotation matrix around an axis (using Rodrigues formula)
function createRotationMatrix(axis: [number, number, number], angleDeg: number, scale: number): Float32Array {
  const theta = (angleDeg * Math.PI) / 180;
  const c = Math.cos(theta) * scale;
  const s = Math.sin(theta) * scale;
  const [x, y, z] = axis;
  const oneMinusC = (1 - Math.cos(theta)) * scale;

  // Rodrigues rotation matrix (column-major)
  return new Float32Array([
    c + x * x * oneMinusC / scale,     x * y * oneMinusC / scale + z * s,  x * z * oneMinusC / scale - y * s,
    x * y * oneMinusC / scale - z * s, c + y * y * oneMinusC / scale,      y * z * oneMinusC / scale + x * s,
    x * z * oneMinusC / scale + y * s, y * z * oneMinusC / scale - x * s,  c + z * z * oneMinusC / scale,
  ]);
}

// Draw the rotation axis as a bright line
function drawRotationAxis(renderer: Renderer, axis: [number, number, number]) {
  const len = 3.0;
  const [ax, ay, az] = axis;

  // Bright gold color for rotation axis
  const axisColor = [1.0, 0.85, 0.3];

  // Draw axis line through origin
  const positions = new Float32Array([
    -ax * len, -ay * len, -az * len,
    ax * len, ay * len, az * len,
  ]);
  const colors = new Float32Array([
    axisColor[0], axisColor[1], axisColor[2],
    axisColor[0], axisColor[1], axisColor[2],
  ]);
  renderer.draw_lines(positions, colors);

  // Draw endpoint markers
  renderer.draw_points(
    new Float32Array([ax * len, ay * len, az * len]),
    new Float32Array(axisColor)
  );
  renderer.draw_points(
    new Float32Array([-ax * len, -ay * len, -az * len]),
    new Float32Array(axisColor)
  );
}

// Draw the rotation plane as a disc/circle perpendicular to the axis
function drawRotationPlane(renderer: Renderer, axis: [number, number, number], angleDeg: number) {
  const [ax, ay, az] = axis;
  const planeColor = [0.3, 0.6, 0.9];
  const alpha = 0.4;

  // Find two perpendicular vectors in the plane
  let u: [number, number, number];
  if (Math.abs(ax) < 0.9) {
    u = [0, -az, ay]; // Cross with X axis
  } else {
    u = [az, 0, -ax]; // Cross with Y axis
  }
  const uLen = Math.sqrt(u[0] * u[0] + u[1] * u[1] + u[2] * u[2]);
  u = [u[0] / uLen, u[1] / uLen, u[2] / uLen];

  // Second perpendicular vector (cross product of axis and u)
  const v: [number, number, number] = [
    ay * u[2] - az * u[1],
    az * u[0] - ax * u[2],
    ax * u[1] - ay * u[0],
  ];

  const radius = 1.5;
  const segments = 32;

  // Draw circle outline
  for (let i = 0; i < segments; i++) {
    const theta1 = (i / segments) * Math.PI * 2;
    const theta2 = ((i + 1) / segments) * Math.PI * 2;

    const p1 = [
      radius * (Math.cos(theta1) * u[0] + Math.sin(theta1) * v[0]),
      radius * (Math.cos(theta1) * u[1] + Math.sin(theta1) * v[1]),
      radius * (Math.cos(theta1) * u[2] + Math.sin(theta1) * v[2]),
    ];
    const p2 = [
      radius * (Math.cos(theta2) * u[0] + Math.sin(theta2) * v[0]),
      radius * (Math.cos(theta2) * u[1] + Math.sin(theta2) * v[1]),
      radius * (Math.cos(theta2) * u[2] + Math.sin(theta2) * v[2]),
    ];

    renderer.draw_lines(
      new Float32Array([...p1, ...p2]),
      new Float32Array([planeColor[0] * alpha, planeColor[1] * alpha, planeColor[2] * alpha, planeColor[0] * alpha, planeColor[1] * alpha, planeColor[2] * alpha])
    );
  }

  // Draw angle arc from 0 to theta
  const arcRadius = 0.5;
  const arcSegments = Math.max(4, Math.floor(Math.abs(angleDeg) / 10));
  const arcColor = [0.9, 0.5, 0.2];

  // Draw reference vector (starting direction)
  renderer.draw_lines(
    new Float32Array([0, 0, 0, u[0] * arcRadius * 2, u[1] * arcRadius * 2, u[2] * arcRadius * 2]),
    new Float32Array([arcColor[0] * 0.5, arcColor[1] * 0.5, arcColor[2] * 0.5, arcColor[0], arcColor[1], arcColor[2]])
  );

  // Draw arc showing rotation angle
  const thetaRad = (angleDeg * Math.PI) / 180;
  for (let i = 0; i < arcSegments; i++) {
    const t1 = (i / arcSegments) * thetaRad;
    const t2 = ((i + 1) / arcSegments) * thetaRad;

    const p1 = [
      arcRadius * (Math.cos(t1) * u[0] + Math.sin(t1) * v[0]),
      arcRadius * (Math.cos(t1) * u[1] + Math.sin(t1) * v[1]),
      arcRadius * (Math.cos(t1) * u[2] + Math.sin(t1) * v[2]),
    ];
    const p2 = [
      arcRadius * (Math.cos(t2) * u[0] + Math.sin(t2) * v[0]),
      arcRadius * (Math.cos(t2) * u[1] + Math.sin(t2) * v[1]),
      arcRadius * (Math.cos(t2) * u[2] + Math.sin(t2) * v[2]),
    ];

    renderer.draw_lines(
      new Float32Array([...p1, ...p2]),
      new Float32Array([arcColor[0], arcColor[1], arcColor[2], arcColor[0], arcColor[1], arcColor[2]])
    );
  }

  // Draw rotated vector endpoint
  const rotatedEndX = arcRadius * 2 * (Math.cos(thetaRad) * u[0] + Math.sin(thetaRad) * v[0]);
  const rotatedEndY = arcRadius * 2 * (Math.cos(thetaRad) * u[1] + Math.sin(thetaRad) * v[1]);
  const rotatedEndZ = arcRadius * 2 * (Math.cos(thetaRad) * u[2] + Math.sin(thetaRad) * v[2]);
  renderer.draw_lines(
    new Float32Array([0, 0, 0, rotatedEndX, rotatedEndY, rotatedEndZ]),
    new Float32Array([arcColor[0], arcColor[1], arcColor[2], arcColor[0], arcColor[1], arcColor[2]])
  );
  renderer.draw_points(
    new Float32Array([rotatedEndX, rotatedEndY, rotatedEndZ]),
    new Float32Array(arcColor)
  );
}

// Draw spiral trajectories for vectors when |λ| ≠ 1
function drawSpiralTrajectory(renderer: Renderer, axis: [number, number, number], angleDeg: number, scale: number, time: number) {
  const [ax, ay, az] = axis;

  // Find perpendicular vectors
  let u: [number, number, number];
  if (Math.abs(ax) < 0.9) {
    u = [0, -az, ay];
  } else {
    u = [az, 0, -ax];
  }
  const uLen = Math.sqrt(u[0] * u[0] + u[1] * u[1] + u[2] * u[2]);
  u = [u[0] / uLen, u[1] / uLen, u[2] / uLen];

  const v: [number, number, number] = [
    ay * u[2] - az * u[1],
    az * u[0] - ax * u[2],
    ax * u[1] - ay * u[0],
  ];

  // Draw multiple spiral trajectories from different starting points
  const startingPoints = [
    [u[0], u[1], u[2]],
    [v[0], v[1], v[2]],
    [-u[0], -u[1], -u[2]],
    [-v[0], -v[1], -v[2]],
  ];

  const spiralColors = [
    [0.9, 0.4, 0.3],  // Red-orange
    [0.3, 0.8, 0.5],  // Green
    [0.4, 0.5, 0.9],  // Blue
    [0.8, 0.6, 0.2],  // Orange
  ];

  const thetaStep = (angleDeg * Math.PI) / 180;
  const iterations = 20;

  for (let s = 0; s < startingPoints.length; s++) {
    const startPt = startingPoints[s];
    const color = spiralColors[s];

    let currentRadius = 1;
    let currentAngle = time * 0.02; // Animate based on time

    for (let i = 0; i < iterations; i++) {
      const t1 = currentAngle + i * thetaStep;
      const t2 = currentAngle + (i + 1) * thetaStep;

      const r1 = currentRadius * Math.pow(scale, i);
      const r2 = currentRadius * Math.pow(scale, i + 1);

      const p1 = [
        r1 * (Math.cos(t1) * u[0] + Math.sin(t1) * v[0]),
        r1 * (Math.cos(t1) * u[1] + Math.sin(t1) * v[1]),
        r1 * (Math.cos(t1) * u[2] + Math.sin(t1) * v[2]),
      ];
      const p2 = [
        r2 * (Math.cos(t2) * u[0] + Math.sin(t2) * v[0]),
        r2 * (Math.cos(t2) * u[1] + Math.sin(t2) * v[1]),
        r2 * (Math.cos(t2) * u[2] + Math.sin(t2) * v[2]),
      ];

      // Check bounds
      if (r2 > 5 || r2 < 0.05) break;

      const alpha = 0.3 + 0.5 * (1 - i / iterations);
      renderer.draw_lines(
        new Float32Array([...p1, ...p2]),
        new Float32Array([color[0] * alpha, color[1] * alpha, color[2] * alpha, color[0] * alpha, color[1] * alpha, color[2] * alpha])
      );
    }

    // Draw starting point
    const sp = startPt;
    renderer.draw_points(
      new Float32Array([sp[0], sp[1], sp[2]]),
      new Float32Array(color)
    );
  }
}

// Draw complex plane inset showing eigenvalues
function drawComplexPlaneInset(renderer: Renderer, angleDeg: number, scale: number) {
  // Draw in a corner of the 3D space (offset from origin)
  const offset = [-2.5, 2.0, 0];
  const planeSize = 1.5;

  const bgColor = [0.15, 0.15, 0.2];
  const circleColor = [0.3, 0.4, 0.5];
  const eigenColor = [0.9, 0.5, 0.2];

  // Draw unit circle
  const circleSegments = 32;
  for (let i = 0; i < circleSegments; i++) {
    const t1 = (i / circleSegments) * Math.PI * 2;
    const t2 = ((i + 1) / circleSegments) * Math.PI * 2;

    const p1 = [offset[0] + Math.cos(t1) * scale, offset[1] + Math.sin(t1) * scale, offset[2]];
    const p2 = [offset[0] + Math.cos(t2) * scale, offset[1] + Math.sin(t2) * scale, offset[2]];

    renderer.draw_lines(
      new Float32Array([...p1, ...p2]),
      new Float32Array([circleColor[0], circleColor[1], circleColor[2], circleColor[0], circleColor[1], circleColor[2]])
    );
  }

  // Draw axes
  renderer.draw_lines(
    new Float32Array([offset[0] - planeSize, offset[1], offset[2], offset[0] + planeSize, offset[1], offset[2]]),
    new Float32Array([bgColor[0], bgColor[1], bgColor[2], bgColor[0], bgColor[1], bgColor[2]])
  );
  renderer.draw_lines(
    new Float32Array([offset[0], offset[1] - planeSize, offset[2], offset[0], offset[1] + planeSize, offset[2]]),
    new Float32Array([bgColor[0], bgColor[1], bgColor[2], bgColor[0], bgColor[1], bgColor[2]])
  );

  // Draw eigenvalues on the circle
  const thetaRad = (angleDeg * Math.PI) / 180;
  const lambda1 = [offset[0] + scale * Math.cos(thetaRad), offset[1] + scale * Math.sin(thetaRad), offset[2]];
  const lambda2 = [offset[0] + scale * Math.cos(-thetaRad), offset[1] + scale * Math.sin(-thetaRad), offset[2]];

  // Draw lines from origin to eigenvalues
  renderer.draw_lines(
    new Float32Array([offset[0], offset[1], offset[2], ...lambda1]),
    new Float32Array([eigenColor[0] * 0.5, eigenColor[1] * 0.5, eigenColor[2] * 0.5, eigenColor[0], eigenColor[1], eigenColor[2]])
  );
  renderer.draw_lines(
    new Float32Array([offset[0], offset[1], offset[2], ...lambda2]),
    new Float32Array([eigenColor[0] * 0.5, eigenColor[1] * 0.5, eigenColor[2] * 0.5, eigenColor[0], eigenColor[1], eigenColor[2]])
  );

  // Draw eigenvalue points
  renderer.draw_points(new Float32Array(lambda1), new Float32Array(eigenColor));
  renderer.draw_points(new Float32Array(lambda2), new Float32Array(eigenColor));

  // Draw real eigenvalue at (1, 0) for the rotation axis
  const realEigen = [offset[0] + 1, offset[1], offset[2]];
  renderer.draw_points(new Float32Array(realEigen), new Float32Array([0.3, 0.9, 0.5]));
}

// ==================== END COMPLEX EIGENVALUES ====================

// Draw point cloud and their iterations
function drawPointCloud(renderer: Renderer, matrix: Float32Array, points: number[][], iterations: number) {
  // Color palette - moderate brightness
  const colors = [
    [0.25, 0.6, 0.25],  // Green
    [0.25, 0.4, 0.65],  // Blue
    [0.6, 0.6, 0.25],   // Yellow
    [0.25, 0.6, 0.6],   // Cyan
    [0.5, 0.25, 0.6],   // Purple
    [0.6, 0.45, 0.2],   // Orange
    [0.4, 0.6, 0.4],    // Light green
    [0.35, 0.5, 0.6],   // Light blue
  ];

  for (let p = 0; p < points.length; p++) {
    const color = colors[p % colors.length];
    let current = [...points[p]];

    // Always draw starting point
    renderer.draw_points(
      new Float32Array(current),
      new Float32Array([color[0] * 0.6, color[1] * 0.6, color[2] * 0.6])
    );

    // Draw iteration path
    for (let i = 0; i < iterations; i++) {
      const next = applyMatrix(matrix, current);

      // Draw line segment
      const positions = new Float32Array([...current, ...next]);
      const alpha = 0.5 + (i / Math.max(1, iterations)) * 0.5;
      const lineColors = new Float32Array([
        color[0] * alpha, color[1] * alpha, color[2] * alpha,
        color[0] * alpha, color[1] * alpha, color[2] * alpha,
      ]);
      renderer.draw_lines(positions, lineColors);

      // Draw point at iteration
      renderer.draw_points(
        new Float32Array(next),
        new Float32Array([color[0] * alpha, color[1] * alpha, color[2] * alpha])
      );

      current = next;
    }
  }
}

// Draw eigenspace visualization - eigenvectors scale by λ^n where n is iteration count
function drawEigenspace(renderer: Renderer, matrix: Float32Array, iterationPower: number) {
  const matrixArray = Array.from(matrix);
  const eigenvals = eigenvalues_3x3(matrixArray);
  const eigenvecs = eigenvectors_3x3(matrixArray);

  // Red-orange colors for eigenvectors
  const eigenColors = [
    [1.0, 0.4, 0.1],    // Bright red-orange
    [0.95, 0.35, 0.15], // Red-orange
    [0.9, 0.3, 0.1],    // Darker red-orange
  ];

  // Fractional factor to slow down elongation (0.3 = 30% of full λ effect)
  const lambdaFactor = 0.3;

  for (let i = 0; i < 3; i++) {
    const lambda = eigenvals[i * 2];     // Real part (eigenvalue)
    const im = eigenvals[i * 2 + 1];     // Imaginary part

    // Only draw for real eigenvalues
    if (Math.abs(im) > 1e-6) continue;

    const vx = eigenvecs[i * 3];
    const vy = eigenvecs[i * 3 + 1];
    const vz = eigenvecs[i * 3 + 2];

    // Skip zero vectors
    const len = Math.sqrt(vx * vx + vy * vy + vz * vz);
    if (len < 1e-6) continue;

    // Normalize to unit eigenvector
    const nx = vx / len;
    const ny = vy / len;
    const nz = vz / len;

    const color = eigenColors[i];

    // Draw faint guide line showing eigenspace direction
    const guideLen = 3.0;
    renderer.draw_lines(
      new Float32Array([-nx * guideLen, -ny * guideLen, -nz * guideLen, nx * guideLen, ny * guideLen, nz * guideLen]),
      new Float32Array([color[0] * 0.15, color[1] * 0.15, color[2] * 0.15, color[0] * 0.15, color[1] * 0.15, color[2] * 0.15])
    );

    // Draw unit marker (original eigenvector length)
    const origPositions = new Float32Array([0, 0, 0, nx, ny, nz]);
    renderer.draw_lines(origPositions, new Float32Array([
      color[0] * 0.3, color[1] * 0.3, color[2] * 0.3,
      color[0] * 0.5, color[1] * 0.5, color[2] * 0.5,
    ]));
    renderer.draw_points(new Float32Array([nx, ny, nz]), new Float32Array([
      color[0] * 0.5, color[1] * 0.5, color[2] * 0.5
    ]));

    // Calculate current scale with fractional factor: λ^(iterationPower * factor)
    // This slows down the elongation rate
    const scaledPower = iterationPower * lambdaFactor;
    let currentScale: number;
    if (lambda >= 0) {
      currentScale = Math.pow(lambda, scaledPower);
    } else {
      // For negative λ, handle sign flipping
      const absScale = Math.pow(Math.abs(lambda), scaledPower);
      // Flip sign on odd iterations (based on original power, not scaled)
      const flipped = Math.floor(iterationPower) % 2 === 1;
      currentScale = flipped ? -absScale : absScale;
    }

    // Clamp to reasonable display range
    const displayScale = Math.max(-3, Math.min(3, currentScale));

    // Draw eigenvector in BOTH directions (positive and negative)
    const tx = nx * displayScale;
    const ty = ny * displayScale;
    const tz = nz * displayScale;

    // Draw eigenvector line in both directions (single line)
    renderer.draw_lines(
      new Float32Array([-tx, -ty, -tz, tx, ty, tz]),
      new Float32Array([color[0], color[1], color[2], color[0], color[1], color[2]])
    );

    // Endpoints on both sides
    renderer.draw_points(new Float32Array([tx, ty, tz]), new Float32Array(color));
    renderer.draw_points(new Float32Array([-tx, -ty, -tz]), new Float32Array(color));
  }
}

function render(time: number) {
  if (!state.renderer || !state.canvas) {
    requestAnimationFrame(render);
    return;
  }

  // Update animation
  if (state.isPlaying && state.animationProgress < 1) {
    state.animationProgress = Math.min(1, state.animationProgress + 0.016 * state.animationSpeed);
  }

  // Update eigenvector animation (animate toward target iteration count)
  if (state.eigenAnimProgress < 1) {
    state.eigenAnimProgress = Math.min(1, state.eigenAnimProgress + 0.05); // ~20 frames to complete
  }

  // Interpolate matrix
  const interpolated = lerp_matrix3(
    Array.from(state.currentMatrix),
    Array.from(state.targetMatrix),
    easeInOutCubic(state.animationProgress)
  );
  const interpMatrix = new Float32Array(interpolated);

  // Camera setup
  const eyeX = state.cameraDistance * Math.cos(state.cameraPhi) * Math.sin(state.cameraTheta);
  const eyeY = state.cameraDistance * Math.sin(state.cameraPhi);
  const eyeZ = state.cameraDistance * Math.cos(state.cameraPhi) * Math.cos(state.cameraTheta);

  const aspect = state.canvas.width / state.canvas.height;
  const projMatrix = perspective(Math.PI / 4, aspect, 0.1, 100);
  const viewMatrix = look_at([eyeX, eyeY, eyeZ], [0, 0, 0], [0, 1, 0]);

  state.renderer.clear();
  state.renderer.use_program();
  state.renderer.set_projection(projMatrix);
  state.renderer.set_view(viewMatrix);

  // Identity model matrix for static elements
  const identityMat4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  state.renderer.set_model(identityMat4);

  // Draw grid (48 divisions) - very subtle
  if (state.showGrid) {
    const gridPos = generate_grid(6, 48);
    const vertexCount = gridPos.length / 3;
    const gridColors = new Float32Array(vertexCount * 3);
    for (let i = 0; i < vertexCount; i++) {
      gridColors[i * 3] = 0.1;      // R - subtle
      gridColors[i * 3 + 1] = 0.1;  // G
      gridColors[i * 3 + 2] = 0.12; // B - slight blue tint
    }
    state.renderer.draw_lines(gridPos, gridColors);
  }

  // Update axis labels positions (follow transformed basis vectors)
  updateAxisLabels(projMatrix, viewMatrix, state.canvas, interpMatrix);

  // Update point labels for affine/convex module
  if (state.currentModule === 'affine-combinations') {
    updatePointLabels(projMatrix, viewMatrix, state.canvas, state.affinePoints);
  } else if (state.currentModule === 'convex-combinations') {
    updatePointLabels(projMatrix, viewMatrix, state.canvas, state.convexPoints);
  }

  // Draw transformed elements using model matrix
  const modelMat4 = mat3_to_mat4(Array.from(interpMatrix));
  state.renderer.set_model(modelMat4);

  // Draw basis vectors (transformed) - white
  if (state.showBasis) {
    const basisPos = generate_basis_vectors();
    // White color for all axes
    const green = [1.0, 1.0, 1.0];
    const basisColors = new Float32Array([
      // X axis
      green[0], green[1], green[2],
      green[0], green[1], green[2],
      // Y axis
      green[0], green[1], green[2],
      green[0], green[1], green[2],
      // Z axis
      green[0], green[1], green[2],
      green[0], green[1], green[2],
    ]);
    state.renderer.draw_lines(basisPos, basisColors);

    // Draw endpoint dots
    const endpoints = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    const endpointColors = new Float32Array([
      green[0], green[1], green[2],
      green[0], green[1], green[2],
      green[0], green[1], green[2],
    ]);
    state.renderer.draw_points(endpoints, endpointColors);
  }

  // Draw unit sphere with meridians and parallels (transformed)
  if (state.showSphere) {
    const spherePos = generateSphere(12, 8);
    const vertexCount = spherePos.length / 3;
    // Soft teal color
    const sphereColors = new Float32Array(vertexCount * 3);
    for (let i = 0; i < vertexCount; i++) {
      sphereColors[i * 3] = 0.15;     // R
      sphereColors[i * 3 + 1] = 0.3;  // G
      sphereColors[i * 3 + 2] = 0.35; // B
    }
    state.renderer.draw_lines(spherePos, sphereColors);
  }

  // Draw custom vector and result (in world space)
  if (state.showVector) {
    state.renderer.set_model(identityMat4); // Reset to world space

    const [vx, vy, vz] = state.customVector;

    // Calculate result vector with current interpolated matrix
    const result = updateResultVector(interpMatrix, state.customVector);
    const [rx, ry, rz] = result;

    // Draw input vector (white) - static, not transformed
    const inputVecPos = new Float32Array([0, 0, 0, vx, vy, vz]);
    const inputVecColors = new Float32Array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0]);
    state.renderer.draw_lines(inputVecPos, inputVecColors);
    const inputEndpoint = new Float32Array([vx, vy, vz]);
    state.renderer.draw_points(inputEndpoint, new Float32Array([1.0, 1.0, 1.0]));

    // Draw result vector (purple/magenta) - the transformed result
    const resultVecPos = new Float32Array([0, 0, 0, rx, ry, rz]);
    const resultVecColors = new Float32Array([0.75, 0.5, 1.0, 0.75, 0.5, 1.0]);
    state.renderer.draw_lines(resultVecPos, resultVecColors);
    const resultEndpoint = new Float32Array([rx, ry, rz]);
    state.renderer.draw_points(resultEndpoint, new Float32Array([0.85, 0.6, 1.0]));
  }

  // Draw eigenspace (eigenvectors scaling by eigenvalues) - in world space
  if (state.showEigenspace) {
    state.renderer.set_model(identityMat4);
    // Calculate animated iteration power: smoothly interpolate from previous to current
    const prevIter = Math.max(0, state.eigenAnimTarget - 1);
    const animatedPower = prevIter + state.eigenAnimProgress * (state.eigenAnimTarget - prevIter);
    drawEigenspace(state.renderer, state.targetMatrix, animatedPower);
  }

  // Draw point cloud showing iteration convergence (eigenvalues module)
  if (state.showPointCloud) {
    state.renderer.set_model(identityMat4);
    drawPointCloud(state.renderer, state.targetMatrix, state.pointCloud, state.iterationCount);
  }

  // Draw null space (degenerate matrices module) - in world space
  if (state.showNullSpace) {
    state.renderer.set_model(identityMat4);
    drawNullSpace(state.renderer, state.targetMatrix);
  }

  // Draw column space (degenerate matrices module) - in world space
  if (state.showColumnSpace) {
    state.renderer.set_model(identityMat4);
    drawColumnSpace(state.renderer, state.targetMatrix);
  }

  // Draw point cloud for degenerate module (shows transformation effect on sphere)
  if (state.showDegenPointCloud) {
    state.renderer.set_model(identityMat4);
    drawDegenPointCloud(state.renderer, state.targetMatrix, state.pointCloud);
  }

  // Draw affine combinations (in world space)
  if (state.currentModule === 'affine-combinations') {
    state.renderer.set_model(identityMat4);

    const weights: [number, number, number] = state.affineWeights;

    if (state.showAffinePoints) {
      drawAffineSourcePoints(state.renderer, state.affinePoints);
    }

    if (state.showAffineHull) {
      drawAffineHull(state.renderer, state.affinePoints, state.affineDimension);
    }

    if (state.showAffineResult) {
      drawAffineResult(state.renderer, state.affinePoints, weights);
    }
  }

  // Draw convex combinations (in world space)
  if (state.currentModule === 'convex-combinations') {
    state.renderer.set_model(identityMat4);

    const weights: [number, number, number] = state.convexWeights;

    if (state.showConvexPoints) {
      drawAffineSourcePoints(state.renderer, state.convexPoints);
    }

    if (state.showConvexHull) {
      drawConvexHull(state.renderer, state.convexPoints);
    }

    if (state.showConvexResult) {
      drawAffineResult(state.renderer, state.convexPoints, weights);
    }
  }

  // Draw complex eigenvalues visualizations (in world space)
  if (state.currentModule === 'complex-eigenvalues') {
    state.renderer.set_model(identityMat4);

    const axis = getRotationAxis(state.rotationAxisType);

    // Update spiral animation time
    if (state.showSpiralTrails) {
      state.spiralTime += 1;
    }

    if (state.showRotationAxis) {
      drawRotationAxis(state.renderer, axis);
    }

    if (state.showRotationPlane) {
      drawRotationPlane(state.renderer, axis, state.rotationAngle);
    }

    if (state.showSpiralTrails) {
      drawSpiralTrajectory(state.renderer, axis, state.rotationAngle, state.scaleFactor, state.spiralTime);
    }

    if (state.showComplexPlane) {
      drawComplexPlaneInset(state.renderer, state.rotationAngle, state.scaleFactor);
    }
  }

  requestAnimationFrame(render);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function updateAxisLabels(proj: number[], view: number[], canvas: HTMLCanvasElement, matrix: Float32Array) {
  // Transform basis vector endpoints by the matrix and add small offset
  const offset = 1.15; // Slightly beyond the endpoint

  // Transform unit vectors by matrix (column-major)
  const xEnd = [
    matrix[0] * offset,
    matrix[1] * offset,
    matrix[2] * offset,
  ];
  const yEnd = [
    matrix[3] * offset,
    matrix[4] * offset,
    matrix[5] * offset,
  ];
  const zEnd = [
    matrix[6] * offset,
    matrix[7] * offset,
    matrix[8] * offset,
  ];

  const axisEndpoints = [
    { id: 'label-x', pos: xEnd },
    { id: 'label-y', pos: yEnd },
    { id: 'label-z', pos: zEnd },
  ];

  const rect = canvas.getBoundingClientRect();

  for (const axis of axisEndpoints) {
    const label = document.getElementById(axis.id);
    if (!label) continue;

    const screen = project3DToScreen(axis.pos, proj, view, rect.width, rect.height);
    if (screen) {
      label.style.left = `${screen.x}px`;
      label.style.top = `${screen.y}px`;
      label.style.display = 'block';
    } else {
      label.style.display = 'none';
    }
  }
}

function project3DToScreen(
  pos: number[],
  proj: number[],
  view: number[],
  width: number,
  height: number
): { x: number; y: number } | null {
  // Multiply view * position
  const vx = view[0] * pos[0] + view[4] * pos[1] + view[8] * pos[2] + view[12];
  const vy = view[1] * pos[0] + view[5] * pos[1] + view[9] * pos[2] + view[13];
  const vz = view[2] * pos[0] + view[6] * pos[1] + view[10] * pos[2] + view[14];
  const vw = view[3] * pos[0] + view[7] * pos[1] + view[11] * pos[2] + view[15];

  // Multiply proj * view_pos
  const px = proj[0] * vx + proj[4] * vy + proj[8] * vz + proj[12] * vw;
  const py = proj[1] * vx + proj[5] * vy + proj[9] * vz + proj[13] * vw;
  const pw = proj[3] * vx + proj[7] * vy + proj[11] * vz + proj[15] * vw;

  if (pw <= 0) return null; // Behind camera

  // Perspective divide and convert to screen coords
  const ndcX = px / pw;
  const ndcY = py / pw;

  const screenX = (ndcX + 1) * 0.5 * width;
  const screenY = (1 - ndcY) * 0.5 * height;

  return { x: screenX, y: screenY };
}

// Update point labels for affine module
function updatePointLabels(proj: number[], view: number[], canvas: HTMLCanvasElement, points: [[number, number, number], [number, number, number], [number, number, number]]) {
  const rect = canvas.getBoundingClientRect();
  const labelIds = ['label-p1', 'label-p2', 'label-p3'];

  for (let i = 0; i < 3; i++) {
    const label = document.getElementById(labelIds[i]);
    if (!label) continue;

    const pos = points[i];
    const screen = project3DToScreen(pos, proj, view, rect.width, rect.height);
    if (screen) {
      label.style.left = `${screen.x + 10}px`;
      label.style.top = `${screen.y - 10}px`;
      label.style.display = 'block';
    } else {
      label.style.display = 'none';
    }
  }
}

// Expose state for controls
(window as any).appState = state;

main();
