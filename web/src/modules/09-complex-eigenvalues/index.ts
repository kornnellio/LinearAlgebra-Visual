import { Module, createLayerConfig, createScene } from '../../types/module.js';
import { AppState } from '../../types/state.js';

// Scene 1: When Eigenvalues Go Complex
// Shows why rotation matrices have complex eigenvalues - vectors rotate, not just scale
const complexIntroScene = createScene(
  'complex-intro',
  'When Eigenvalues Go Complex',
  'Rotation matrices have complex eigenvalues because vectors in the rotation plane change direction - they cannot be eigenvectors. Only the rotation axis (λ=1) stays fixed.',
  [
    createLayerConfig('grid', true, { size: 6, divisions: 24 }),
    createLayerConfig('axes', true, { length: 3 }),
    createLayerConfig('custom', true, { type: 'complex-eigen' }),
  ],
  {
    controls: [
      { type: 'preset', id: 'rotation-preset', label: 'Rotation', params: { presets: ['rotateX', 'rotateY', 'rotateZ'] } },
      { type: 'slider', id: 'rotation-angle', label: 'Angle', params: { min: 0, max: 360 } },
    ],
    invariants: [
      { type: 'eigenvalues', position: 'sidebar', highlight: true },
    ],
    setup: (state: AppState) => {
      state.showRotationAxis = true;
      state.showRotationPlane = true;
      state.showComplexPlane = true;
      state.showSpiralTrails = false;
      state.rotationAngle = 45;
      state.scaleFactor = 1;
      state.rotationAxisType = 'Z';
    },
    update: (_state: AppState, _dt: number) => {},
    teardown: (_state: AppState) => {},
  }
);

// Scene 2: The Rotation Axis
// The real eigenvector with λ=1 is the rotation axis
const rotationAxisScene = createScene(
  'rotation-axis',
  'The Rotation Axis',
  'The rotation axis is the eigenvector with eigenvalue λ=1. Vectors ON the axis stay fixed. Vectors OFF the axis rotate around it.',
  [
    createLayerConfig('grid', true, { size: 6, divisions: 24 }),
    createLayerConfig('axes', true, { length: 3 }),
    createLayerConfig('custom', true, { type: 'complex-eigen' }),
  ],
  {
    controls: [
      { type: 'preset', id: 'axis-preset', label: 'Axis', params: { presets: ['X', 'Y', 'Z', 'custom'] } },
      { type: 'slider', id: 'rotation-angle', label: 'Angle', params: { min: 0, max: 360 } },
    ],
    invariants: [],
    setup: (state: AppState) => {
      state.showRotationAxis = true;
      state.showRotationPlane = true;
      state.showComplexPlane = false;
      state.showSpiralTrails = false;
      state.rotationAngle = 60;
      state.scaleFactor = 1;
      state.rotationAxisType = 'Z';
    },
    update: (_state: AppState, _dt: number) => {},
    teardown: (_state: AppState) => {},
  }
);

// Scene 3: Rotation Angle from Eigenvalues
// arg(λ) gives the rotation angle θ
const angleFromEigenScene = createScene(
  'angle-from-eigen',
  'Rotation Angle from Eigenvalues',
  'The complex eigenvalues e^(±iθ) encode the rotation angle. On the complex plane, they sit on the unit circle at angle ±θ from the real axis.',
  [
    createLayerConfig('grid', true, { size: 6, divisions: 24 }),
    createLayerConfig('axes', true, { length: 3 }),
    createLayerConfig('custom', true, { type: 'complex-eigen' }),
  ],
  {
    controls: [
      { type: 'slider', id: 'rotation-angle', label: 'θ (degrees)', params: { min: 0, max: 360 } },
    ],
    invariants: [],
    setup: (state: AppState) => {
      state.showRotationAxis = true;
      state.showRotationPlane = true;
      state.showComplexPlane = true;
      state.showSpiralTrails = false;
      state.rotationAngle = 45;
      state.scaleFactor = 1;
      state.rotationAxisType = 'Z';
    },
    update: (_state: AppState, _dt: number) => {},
    teardown: (_state: AppState) => {},
  }
);

// Scene 4: Spirals - Rotation + Scaling
// When |λ| ≠ 1, vectors spiral inward or outward
const spiralScene = createScene(
  'spirals',
  'Spirals: Rotation + Scaling',
  'When |λ| ≠ 1, vectors spiral while rotating. |λ| > 1 spirals outward (growing), |λ| < 1 spirals inward (shrinking). Pure rotation has |λ| = 1.',
  [
    createLayerConfig('grid', true, { size: 6, divisions: 24 }),
    createLayerConfig('axes', true, { length: 3 }),
    createLayerConfig('custom', true, { type: 'complex-eigen' }),
  ],
  {
    controls: [
      { type: 'slider', id: 'rotation-angle', label: 'θ (degrees)', params: { min: 0, max: 360 } },
      { type: 'slider', id: 'scale-factor', label: 'Scale |λ|', params: { min: 0.5, max: 1.5 } },
    ],
    invariants: [],
    setup: (state: AppState) => {
      state.showRotationAxis = true;
      state.showRotationPlane = false;
      state.showComplexPlane = true;
      state.showSpiralTrails = true;
      state.rotationAngle = 30;
      state.scaleFactor = 1.1;
      state.rotationAxisType = 'Z';
    },
    update: (_state: AppState, _dt: number) => {},
    teardown: (_state: AppState) => {},
  }
);

// Module 09: Complex Eigenvalues
export const module09: Module = {
  id: 'complex-eigenvalues',
  title: 'Complex Eigenvalues',
  description: 'Explore complex eigenvalues through rotation matrices. Learn how the rotation axis is the real eigenvector, and how eigenvalue arguments encode rotation angles.',
  prerequisites: ['eigenvalues'],
  scenes: [complexIntroScene, rotationAxisScene, angleFromEigenScene, spiralScene],
  conceptConnections: [
    {
      targetModule: 'eigenvalues',
      relationship: 'extends',
      description: 'Complex eigenvalues arise when real eigenvectors do not exist',
    },
    {
      targetModule: 'matrices-as-maps',
      relationship: 'applies',
      description: 'Rotation matrices are special linear transformations',
    },
  ],
};

export default module09;
