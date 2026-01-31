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
  // Affine combinations module (3 points)
  affinePoints: [[number, number, number], [number, number, number], [number, number, number]];
  affineWeights: [number, number, number];
  affineFrozen: [boolean, boolean, boolean];
  showAffineHull: boolean;
  showAffineResult: boolean;
  showAffinePoints: boolean;
  affineDimension: number;
  // Convex combinations module (3 points)
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

  // Affine combinations controls
  setupAffineControls(state);

  // Convex combinations controls
  setupConvexControls(state);

  // Complex eigenvalues controls
  setupComplexEigenControls(state);
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

// Affine combinations module controls
function setupAffineControls(state: AppState) {
  // Point inputs (P1, P2, P3)
  for (let i = 0; i < 3; i++) {
    const pIdx = i + 1;
    const xInput = document.getElementById(`p${pIdx}-x`) as HTMLInputElement;
    const yInput = document.getElementById(`p${pIdx}-y`) as HTMLInputElement;
    const zInput = document.getElementById(`p${pIdx}-z`) as HTMLInputElement;

    const updatePoint = () => {
      state.affinePoints[i] = [
        parseFloat(xInput?.value) || 0,
        parseFloat(yInput?.value) || 0,
        parseFloat(zInput?.value) || 0,
      ];
      updateAffineDisplay(state);
    };

    xInput?.addEventListener('input', updatePoint);
    yInput?.addEventListener('input', updatePoint);
    zInput?.addEventListener('input', updatePoint);
  }

  // Weight inputs (w1, w2, w3) with freeze support
  const affineWeightInputs = [
    document.getElementById('weight-1') as HTMLInputElement,
    document.getElementById('weight-2') as HTMLInputElement,
    document.getElementById('weight-3') as HTMLInputElement,
  ];
  const affineFreezeInputs = [
    document.getElementById('affine-freeze-1') as HTMLInputElement,
    document.getElementById('affine-freeze-2') as HTMLInputElement,
    document.getElementById('affine-freeze-3') as HTMLInputElement,
  ];

  // Handle freeze checkbox changes
  for (let i = 0; i < 3; i++) {
    affineFreezeInputs[i]?.addEventListener('change', () => {
      state.affineFrozen[i] = affineFreezeInputs[i].checked;
    });
  }

  // When one weight changes, adjust non-frozen weights proportionally
  const updateAffineWeight = (changedIndex: number) => {
    if (state.affineFrozen[changedIndex]) return; // Can't change frozen weight

    const input = affineWeightInputs[changedIndex];
    const newVal = parseFloat(input?.value) || 0;

    // Find non-frozen other indices
    const otherIndices = [0, 1, 2].filter(i => i !== changedIndex && !state.affineFrozen[i]);

    // If no other weights can adjust (2 frozen), this weight is also locked
    if (otherIndices.length === 0) {
      input.value = state.affineWeights[changedIndex].toFixed(2);
      return;
    }

    const frozenSum = [0, 1, 2]
      .filter(i => i !== changedIndex && state.affineFrozen[i])
      .reduce((sum, i) => sum + state.affineWeights[i], 0);

    state.affineWeights[changedIndex] = newVal;
    const remaining = 1 - newVal - frozenSum;

    const otherSum = otherIndices.reduce((sum, i) => sum + state.affineWeights[i], 0);
    if (otherSum > 0) {
      const scale = remaining / otherSum;
      for (const i of otherIndices) {
        state.affineWeights[i] = state.affineWeights[i] * scale;
      }
    } else {
      const share = remaining / otherIndices.length;
      for (const i of otherIndices) {
        state.affineWeights[i] = share;
      }
    }

    // Update all input displays
    for (let i = 0; i < 3; i++) {
      if (affineWeightInputs[i]) affineWeightInputs[i].value = state.affineWeights[i].toFixed(2);
    }
    updateAffineDisplay(state);
  };

  for (let i = 0; i < 3; i++) {
    affineWeightInputs[i]?.addEventListener('input', () => updateAffineWeight(i));
  }

  // Display toggles
  const showHull = document.getElementById('show-affine-hull') as HTMLInputElement;
  showHull?.addEventListener('change', () => {
    state.showAffineHull = showHull.checked;
  });

  const showResult = document.getElementById('show-affine-result') as HTMLInputElement;
  showResult?.addEventListener('change', () => {
    state.showAffineResult = showResult.checked;
  });

  const showPoints = document.getElementById('show-affine-points') as HTMLInputElement;
  showPoints?.addEventListener('change', () => {
    state.showAffinePoints = showPoints.checked;
  });

  // Reset button
  const resetBtn = document.getElementById('reset-affine-btn');
  resetBtn?.addEventListener('click', () => {
    state.affinePoints = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    state.affineWeights = [0.33, 0.33, 0.34];
    state.affineFrozen = [false, false, false];
    setAffineInputs(state);
    updateAffineDisplay(state);
  });

  // Initialize display
  updateAffineDisplay(state);
}

function setAffineInputs(state: AppState) {
  // Set point inputs (3 points)
  for (let i = 0; i < 3; i++) {
    const pIdx = i + 1;
    const xInput = document.getElementById(`p${pIdx}-x`) as HTMLInputElement;
    const yInput = document.getElementById(`p${pIdx}-y`) as HTMLInputElement;
    const zInput = document.getElementById(`p${pIdx}-z`) as HTMLInputElement;
    if (xInput) xInput.value = state.affinePoints[i][0].toString();
    if (yInput) yInput.value = state.affinePoints[i][1].toString();
    if (zInput) zInput.value = state.affinePoints[i][2].toString();
  }

  // Set weight inputs (3 weights) and freeze checkboxes
  for (let i = 0; i < 3; i++) {
    const input = document.getElementById(`weight-${i + 1}`) as HTMLInputElement;
    const freezeInput = document.getElementById(`affine-freeze-${i + 1}`) as HTMLInputElement;
    if (input) input.value = state.affineWeights[i].toFixed(2);
    if (freezeInput) freezeInput.checked = state.affineFrozen[i];
  }
}

export function updateAffineDisplay(state: AppState) {
  // All weights are now stored in state
  const weights = state.affineWeights;

  // Compute affine dimension (rank of vectors from P1 to other points)
  const [p1, p2, p3] = state.affinePoints;
  const v1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
  const v2 = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];

  // Simple rank computation using cross product
  const eps = 1e-6;
  const len1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]);
  const len2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1] + v2[2] * v2[2]);

  let dimension = 0;
  if (len1 > eps || len2 > eps) {
    dimension = 1;
    // Check if v2 is linearly independent of v1
    const cross12 = [
      v1[1] * v2[2] - v1[2] * v2[1],
      v1[2] * v2[0] - v1[0] * v2[2],
      v1[0] * v2[1] - v1[1] * v2[0],
    ];
    const crossLen12 = Math.sqrt(cross12[0] * cross12[0] + cross12[1] * cross12[1] + cross12[2] * cross12[2]);
    if (crossLen12 > eps) {
      dimension = 2;
    }
  }

  state.affineDimension = dimension;
  const dimEl = document.getElementById('affine-dim-value');
  if (dimEl) dimEl.textContent = dimension.toString();

  // Compute result point R = w1*P1 + w2*P2 + w3*P3
  const result = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    result[0] += weights[i] * state.affinePoints[i][0];
    result[1] += weights[i] * state.affinePoints[i][1];
    result[2] += weights[i] * state.affinePoints[i][2];
  }

  const resultEl = document.getElementById('affine-result-value');
  if (resultEl) {
    resultEl.textContent = `(${result[0].toFixed(2)}, ${result[1].toFixed(2)}, ${result[2].toFixed(2)})`;
  }
}

// Convex combinations module controls
function setupConvexControls(state: AppState) {
  // Point inputs (P1, P2, P3)
  for (let i = 0; i < 3; i++) {
    const pIdx = i + 1;
    const xInput = document.getElementById(`convex-p${pIdx}-x`) as HTMLInputElement;
    const yInput = document.getElementById(`convex-p${pIdx}-y`) as HTMLInputElement;
    const zInput = document.getElementById(`convex-p${pIdx}-z`) as HTMLInputElement;

    const updatePoint = () => {
      state.convexPoints[i] = [
        parseFloat(xInput?.value) || 0,
        parseFloat(yInput?.value) || 0,
        parseFloat(zInput?.value) || 0,
      ];
      updateConvexDisplay(state);
    };

    xInput?.addEventListener('input', updatePoint);
    yInput?.addEventListener('input', updatePoint);
    zInput?.addEventListener('input', updatePoint);
  }

  // Weight inputs (w1, w2, w3) with freeze support - enforce convex constraint: all weights >= 0, sum = 1
  const convexWeightInputs = [
    document.getElementById('convex-weight-1') as HTMLInputElement,
    document.getElementById('convex-weight-2') as HTMLInputElement,
    document.getElementById('convex-weight-3') as HTMLInputElement,
  ];
  const convexFreezeInputs = [
    document.getElementById('convex-freeze-1') as HTMLInputElement,
    document.getElementById('convex-freeze-2') as HTMLInputElement,
    document.getElementById('convex-freeze-3') as HTMLInputElement,
  ];

  // Handle freeze checkbox changes
  for (let i = 0; i < 3; i++) {
    convexFreezeInputs[i]?.addEventListener('change', () => {
      state.convexFrozen[i] = convexFreezeInputs[i].checked;
    });
  }

  // When one weight changes, adjust non-frozen weights proportionally
  const updateConvexWeight = (changedIndex: number) => {
    if (state.convexFrozen[changedIndex]) return; // Can't change frozen weight

    const input = convexWeightInputs[changedIndex];
    let newVal = parseFloat(input?.value) || 0;

    // Find non-frozen other indices
    const otherIndices = [0, 1, 2].filter(i => i !== changedIndex && !state.convexFrozen[i]);

    // If no other weights can adjust (2 frozen), this weight is also locked
    if (otherIndices.length === 0) {
      input.value = state.convexWeights[changedIndex].toFixed(2);
      return;
    }

    const frozenSum = [0, 1, 2]
      .filter(i => i !== changedIndex && state.convexFrozen[i])
      .reduce((sum, i) => sum + state.convexWeights[i], 0);

    // For convex: clamp so remaining weights stay >= 0
    // Max value = 1 - frozenSum (leaves 0 for others)
    const maxVal = 1 - frozenSum;
    newVal = Math.max(0, Math.min(maxVal, newVal));

    state.convexWeights[changedIndex] = newVal;
    const remaining = 1 - newVal - frozenSum;

    const otherSum = otherIndices.reduce((sum, i) => sum + state.convexWeights[i], 0);
    if (otherSum > 0) {
      const scale = remaining / otherSum;
      for (const i of otherIndices) {
        state.convexWeights[i] = state.convexWeights[i] * scale;
      }
    } else {
      const share = remaining / otherIndices.length;
      for (const i of otherIndices) {
        state.convexWeights[i] = share;
      }
    }

    // Update all input displays
    for (let i = 0; i < 3; i++) {
      if (convexWeightInputs[i]) convexWeightInputs[i].value = state.convexWeights[i].toFixed(2);
    }

    updateConvexDisplay(state);
  };

  for (let i = 0; i < 3; i++) {
    convexWeightInputs[i]?.addEventListener('input', () => updateConvexWeight(i));
  }

  // Display toggles
  const showHull = document.getElementById('show-convex-hull') as HTMLInputElement;
  showHull?.addEventListener('change', () => {
    state.showConvexHull = showHull.checked;
  });

  const showResult = document.getElementById('show-convex-result') as HTMLInputElement;
  showResult?.addEventListener('change', () => {
    state.showConvexResult = showResult.checked;
  });

  const showPoints = document.getElementById('show-convex-points') as HTMLInputElement;
  showPoints?.addEventListener('change', () => {
    state.showConvexPoints = showPoints.checked;
  });

  // Reset button
  const resetBtn = document.getElementById('reset-convex-btn');
  resetBtn?.addEventListener('click', () => {
    state.convexPoints = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    state.convexWeights = [0.33, 0.33, 0.34];
    state.convexFrozen = [false, false, false];
    setConvexInputs(state);
    updateConvexDisplay(state);
  });

  // Initialize display
  updateConvexDisplay(state);
}

function setConvexInputs(state: AppState) {
  // Set point inputs (3 points)
  for (let i = 0; i < 3; i++) {
    const pIdx = i + 1;
    const xInput = document.getElementById(`convex-p${pIdx}-x`) as HTMLInputElement;
    const yInput = document.getElementById(`convex-p${pIdx}-y`) as HTMLInputElement;
    const zInput = document.getElementById(`convex-p${pIdx}-z`) as HTMLInputElement;
    if (xInput) xInput.value = state.convexPoints[i][0].toString();
    if (yInput) yInput.value = state.convexPoints[i][1].toString();
    if (zInput) zInput.value = state.convexPoints[i][2].toString();
  }

  // Set weight inputs (3 weights) and freeze checkboxes
  for (let i = 0; i < 3; i++) {
    const input = document.getElementById(`convex-weight-${i + 1}`) as HTMLInputElement;
    const freezeInput = document.getElementById(`convex-freeze-${i + 1}`) as HTMLInputElement;
    if (input) input.value = state.convexWeights[i].toFixed(2);
    if (freezeInput) freezeInput.checked = state.convexFrozen[i];
  }
}

export function updateConvexDisplay(state: AppState) {
  // All weights are now stored in state (sum = 1, all >= 0)
  const weights = state.convexWeights;
  const result = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    result[0] += weights[i] * state.convexPoints[i][0];
    result[1] += weights[i] * state.convexPoints[i][1];
    result[2] += weights[i] * state.convexPoints[i][2];
  }

  const resultEl = document.getElementById('convex-result-value');
  if (resultEl) {
    resultEl.textContent = `(${result[0].toFixed(2)}, ${result[1].toFixed(2)}, ${result[2].toFixed(2)})`;
  }
}

// Complex eigenvalues module controls
function setupComplexEigenControls(state: AppState) {
  // Rotation axis presets
  const axisButtons = document.querySelectorAll<HTMLButtonElement>('.complex-axis-btn');
  axisButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all
      axisButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.rotationAxisType = btn.dataset.axis || 'Z';
      updateComplexEigenDisplay(state);
    });
  });

  // Rotation angle slider
  const angleSlider = document.getElementById('rotation-angle-slider') as HTMLInputElement;
  const angleValue = document.getElementById('rotation-angle-value');
  angleSlider?.addEventListener('input', () => {
    state.rotationAngle = parseFloat(angleSlider.value);
    if (angleValue) angleValue.textContent = `${state.rotationAngle}°`;
    updateComplexEigenDisplay(state);
  });

  // Scale factor slider
  const scaleSlider = document.getElementById('scale-factor-slider') as HTMLInputElement;
  const scaleValue = document.getElementById('scale-factor-value');
  scaleSlider?.addEventListener('input', () => {
    state.scaleFactor = parseFloat(scaleSlider.value);
    if (scaleValue) scaleValue.textContent = state.scaleFactor.toFixed(2);
    updateComplexEigenDisplay(state);
  });

  // Display toggles
  const showRotationAxis = document.getElementById('show-rotation-axis') as HTMLInputElement;
  showRotationAxis?.addEventListener('change', () => {
    state.showRotationAxis = showRotationAxis.checked;
  });

  const showRotationPlane = document.getElementById('show-rotation-plane') as HTMLInputElement;
  showRotationPlane?.addEventListener('change', () => {
    state.showRotationPlane = showRotationPlane.checked;
  });

  const showComplexPlane = document.getElementById('show-complex-plane') as HTMLInputElement;
  showComplexPlane?.addEventListener('change', () => {
    state.showComplexPlane = showComplexPlane.checked;
  });

  const showSpiralTrails = document.getElementById('show-spiral-trails') as HTMLInputElement;
  showSpiralTrails?.addEventListener('change', () => {
    state.showSpiralTrails = showSpiralTrails.checked;
  });

  // Reset button
  const resetBtn = document.getElementById('reset-complex-btn');
  resetBtn?.addEventListener('click', () => {
    state.rotationAngle = 45;
    state.scaleFactor = 1;
    state.rotationAxisType = 'Z';
    state.showRotationAxis = true;
    state.showRotationPlane = true;
    state.showComplexPlane = false;
    state.showSpiralTrails = false;

    // Update UI
    if (angleSlider) angleSlider.value = '45';
    if (angleValue) angleValue.textContent = '45°';
    if (scaleSlider) scaleSlider.value = '1';
    if (scaleValue) scaleValue.textContent = '1.00';
    if (showRotationAxis) showRotationAxis.checked = true;
    if (showRotationPlane) showRotationPlane.checked = true;
    if (showComplexPlane) showComplexPlane.checked = false;
    if (showSpiralTrails) showSpiralTrails.checked = false;

    // Update axis button
    axisButtons.forEach(b => b.classList.remove('active'));
    const zBtn = document.querySelector('.complex-axis-btn[data-axis="Z"]');
    zBtn?.classList.add('active');

    updateComplexEigenDisplay(state);
  });

  // Initialize display
  updateComplexEigenDisplay(state);
}

export function updateComplexEigenDisplay(state: AppState) {
  const theta = state.rotationAngle;
  const r = state.scaleFactor;

  // Update eigenvalue display
  const lambda1El = document.getElementById('complex-lambda1');
  const lambda23El = document.getElementById('complex-lambda23');

  if (lambda1El) {
    if (r === 1) {
      lambda1El.textContent = '1';
    } else {
      lambda1El.textContent = r.toFixed(2);
    }
  }

  if (lambda23El) {
    if (r === 1) {
      lambda23El.textContent = `e^(±i${theta}°)`;
    } else {
      lambda23El.textContent = `${r.toFixed(2)}·e^(±i${theta}°)`;
    }
  }
}
