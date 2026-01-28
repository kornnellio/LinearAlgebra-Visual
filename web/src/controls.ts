import { determinant3, identity3 } from '../pkg/visual_algebra_core.js';

interface AppState {
  currentMatrix: Float32Array;
  targetMatrix: Float32Array;
  animationProgress: number;
  isPlaying: boolean;
  animationSpeed: number;
  showGrid: boolean;
  showSphere: boolean;
  showBasis: boolean;
  showVector: boolean;
  showEigenspace: boolean;
  showPointCloud: boolean;
  iterationCount: number;
  customVector: [number, number, number];
  eigenAnimTarget: number;
  eigenAnimProgress: number;
  showNullSpace: boolean;
  showColumnSpace: boolean;
  showDegenPointCloud: boolean;
}

// Optional callback for when matrix changes
let onMatrixChangeCallback: ((matrix: Float32Array) => void) | null = null;

export function setOnMatrixChange(callback: (matrix: Float32Array) => void) {
  onMatrixChangeCallback = callback;
}

export function setupControls(state: AppState, applyPreset: (preset: string) => void) {
  createMatrixInputs();
  setMatrixToInputs(state.targetMatrix);
  updateDeterminant(state.targetMatrix);

  // Matrix input handlers - auto-apply changes immediately
  const matrixInputs = document.querySelectorAll<HTMLInputElement>('.matrix-grid input');
  matrixInputs.forEach((input) => {
    input.addEventListener('input', () => {
      state.targetMatrix = getMatrixFromInputs();
      state.currentMatrix = new Float32Array(state.targetMatrix);
      state.animationProgress = 1;
      updateDeterminant(state.targetMatrix);
      onMatrixChangeCallback?.(state.targetMatrix);
    });
  });

  // Preset buttons
  document.querySelectorAll<HTMLButtonElement>('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      if (preset) applyPreset(preset);
    });
  });

  // Reset Transform button (matrices module)
  const resetTransformBtn = document.getElementById('reset-transform-btn');
  resetTransformBtn?.addEventListener('click', () => {
    state.targetMatrix = new Float32Array(identity3());
    state.currentMatrix = new Float32Array(identity3());
    state.animationProgress = 1;
    setMatrixToInputs(state.targetMatrix);
    updateDeterminant(state.targetMatrix);
    onMatrixChangeCallback?.(state.targetMatrix);
  });

  // Reset button (eigenvalues module)
  const resetEigenBtn = document.getElementById('reset-eigen-btn');
  resetEigenBtn?.addEventListener('click', () => {
    state.targetMatrix = new Float32Array(identity3());
    state.currentMatrix = new Float32Array(identity3());
    state.animationProgress = 1;
    setMatrixToInputs(state.targetMatrix);
    updateDeterminant(state.targetMatrix);
    onMatrixChangeCallback?.(state.targetMatrix);
  });

  // Display toggles (matrices module)
  const showGrid = document.getElementById('show-grid') as HTMLInputElement;
  showGrid?.addEventListener('change', () => {
    state.showGrid = showGrid.checked;
  });

  const showSphere = document.getElementById('show-sphere') as HTMLInputElement;
  showSphere?.addEventListener('change', () => {
    state.showSphere = showSphere.checked;
  });

  const showBasis = document.getElementById('show-basis') as HTMLInputElement;
  showBasis?.addEventListener('change', () => {
    state.showBasis = showBasis.checked;
  });

  const showVector = document.getElementById('show-vector') as HTMLInputElement;
  showVector?.addEventListener('change', () => {
    state.showVector = showVector.checked;
  });

  // Display toggles (eigenvalues module)
  const showEigenspace = document.getElementById('show-eigenspace') as HTMLInputElement;
  showEigenspace?.addEventListener('change', () => {
    state.showEigenspace = showEigenspace.checked;
  });

  const showPointCloud = document.getElementById('show-pointcloud') as HTMLInputElement;
  showPointCloud?.addEventListener('change', () => {
    state.showPointCloud = showPointCloud.checked;
  });

  // Custom vector inputs (matrices module)
  const vecX = document.getElementById('vec-x') as HTMLInputElement;
  const vecY = document.getElementById('vec-y') as HTMLInputElement;
  const vecZ = document.getElementById('vec-z') as HTMLInputElement;

  const updateVector = () => {
    state.customVector = [
      parseFloat(vecX?.value) || 0,
      parseFloat(vecY?.value) || 0,
      parseFloat(vecZ?.value) || 0,
    ];
  };

  vecX?.addEventListener('input', updateVector);
  vecY?.addEventListener('input', updateVector);
  vecZ?.addEventListener('input', updateVector);

  // Iteration controls (eigenvalues module)
  setupIterationControls(state);

  // Degenerate matrix controls
  setupDegenerateControls(state, applyPreset);
}

function setupIterationControls(state: AppState) {
  const iterStep = document.getElementById('iter-step');
  const iterReset = document.getElementById('iter-reset');
  const iterCount = document.getElementById('iteration-count');

  const updateIterationDisplay = () => {
    if (iterCount) iterCount.textContent = state.iterationCount.toString();
  };

  // Ax button - apply matrix once (triggers eigenvector animation)
  iterStep?.addEventListener('click', () => {
    state.iterationCount++;
    state.eigenAnimTarget = state.iterationCount;
    state.eigenAnimProgress = 0; // Start animation
    updateIterationDisplay();
  });

  // Reset button
  iterReset?.addEventListener('click', () => {
    state.iterationCount = 0;
    state.eigenAnimTarget = 0;
    state.eigenAnimProgress = 1; // No animation needed
    updateIterationDisplay();
  });
}

function setupDegenerateControls(state: AppState, _applyPreset: (preset: string) => void) {
  // Reset button (degenerate module)
  const resetDegenBtn = document.getElementById('reset-degen-btn');
  resetDegenBtn?.addEventListener('click', () => {
    state.targetMatrix = new Float32Array(identity3());
    setMatrixToInputs(state.targetMatrix);
    updateDeterminant(state.targetMatrix);
    onMatrixChangeCallback?.(state.targetMatrix);
  });

  // Display toggles (degenerate module)
  const showNullSpace = document.getElementById('show-null-space') as HTMLInputElement;
  showNullSpace?.addEventListener('change', () => {
    state.showNullSpace = showNullSpace.checked;
  });

  const showColumnSpace = document.getElementById('show-column-space') as HTMLInputElement;
  showColumnSpace?.addEventListener('change', () => {
    state.showColumnSpace = showColumnSpace.checked;
  });

  const showDegenPointCloud = document.getElementById('show-degen-pointcloud') as HTMLInputElement;
  showDegenPointCloud?.addEventListener('change', () => {
    state.showDegenPointCloud = showDegenPointCloud.checked;
  });

  const showDegenBasis = document.getElementById('show-degen-basis') as HTMLInputElement;
  showDegenBasis?.addEventListener('change', () => {
    state.showBasis = showDegenBasis.checked;
  });
}

export function updateResultVector(matrix: Float32Array, v: [number, number, number]) {
  // Matrix-vector multiplication (column-major)
  const rx = matrix[0] * v[0] + matrix[3] * v[1] + matrix[6] * v[2];
  const ry = matrix[1] * v[0] + matrix[4] * v[1] + matrix[7] * v[2];
  const rz = matrix[2] * v[0] + matrix[5] * v[1] + matrix[8] * v[2];

  const resX = document.getElementById('res-x');
  const resY = document.getElementById('res-y');
  const resZ = document.getElementById('res-z');

  if (resX) resX.textContent = rx.toFixed(2);
  if (resY) resY.textContent = ry.toFixed(2);
  if (resZ) resZ.textContent = rz.toFixed(2);

  return [rx, ry, rz] as [number, number, number];
}

function createMatrixInputs() {
  const container = document.getElementById('matrix-input');
  if (!container) return;

  container.innerHTML = '';

  // Create inputs in row-major order for display, but store column-major
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const input = document.createElement('input');
      input.type = 'number';
      input.step = '0.1';
      input.dataset.row = String(row);
      input.dataset.col = String(col);
      // Column-major index
      input.dataset.index = String(col * 3 + row);
      container.appendChild(input);
    }
  }
}

export function getMatrixFromInputs(): Float32Array {
  const matrix = new Float32Array(9);
  const inputs = document.querySelectorAll<HTMLInputElement>('.matrix-grid input');

  inputs.forEach((input) => {
    const index = parseInt(input.dataset.index || '0');
    matrix[index] = parseFloat(input.value) || 0;
  });

  return matrix;
}

export function setMatrixToInputs(matrix: Float32Array) {
  const inputs = document.querySelectorAll<HTMLInputElement>('.matrix-grid input');

  inputs.forEach((input) => {
    const index = parseInt(input.dataset.index || '0');
    input.value = matrix[index].toFixed(2);
  });
}

export function updateDeterminant(matrix: Float32Array) {
  const det = determinant3(Array.from(matrix));
  const detElement = document.getElementById('determinant');
  if (detElement) {
    detElement.textContent = `D: ${det.toFixed(3)}`;
    detElement.style.color = det < 0 ? '#f87171' : det === 0 ? '#fbbf24' : '#4ade80';
  }
}
