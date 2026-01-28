import { Module, createLayerConfig, createScene } from '../../types/module.js';
import { AppState } from '../../types/state.js';

// Scene 1: What are Eigenvectors?
// Shows that eigenvectors are directions that only scale, not rotate
const eigenvectorDiscoveryScene = createScene(
  'eigenvector-discovery',
  'Invariant Directions',
  'Eigenvectors are directions that only SCALE under transformation - they never rotate. Watch the golden lines stay fixed while other vectors spiral.',
  [
    createLayerConfig('grid', true, { size: 6, divisions: 24 }),
    createLayerConfig('axes', true, { length: 3 }),
    createLayerConfig('eigenspace', true, {}),
    createLayerConfig('basis', false, {}),
    createLayerConfig('cube', false, {}),
  ],
  {
    controls: [
      { type: 'matrix', id: 'main-matrix', params: {} },
      { type: 'preset', id: 'presets', params: { presets: ['scale', 'shear', 'rotateZ'] } },
    ],
    invariants: [
      { type: 'eigenvalues', position: 'sidebar', highlight: true },
    ],
    setup: (state: AppState) => {
      state.showEigenspace = true;
      state.showBasis = false;
      state.showCube = false;
      state.showPointCloud = true;
      state.iterationCount = 0;
    },
    update: (_state: AppState, _dt: number) => {},
    teardown: (_state: AppState) => {},
  }
);

// Scene 2: Power Method
// Shows how repeated multiplication converges to dominant eigenvector
const powerMethodScene = createScene(
  'power-method',
  'Power Method',
  'Multiply any vector repeatedly by A. Watch ALL vectors converge toward the dominant eigenvector direction!',
  [
    createLayerConfig('grid', true, { size: 6, divisions: 24 }),
    createLayerConfig('axes', true, { length: 3 }),
    createLayerConfig('eigenspace', true, {}),
    createLayerConfig('trail', true, {}),
  ],
  {
    controls: [
      { type: 'matrix', id: 'main-matrix', params: {} },
      { type: 'button', id: 'iterate', label: 'Apply A', params: {} },
    ],
    invariants: [
      { type: 'eigenvalues', position: 'sidebar', highlight: true },
    ],
    setup: (state: AppState) => {
      state.showEigenspace = true;
      state.showPointCloud = true;
      state.showIteration = true;
      state.iterationCount = 0;
    },
    update: (_state: AppState, _dt: number) => {},
    teardown: (_state: AppState) => {},
  }
);

// Scene 3: Eigenvalue Meaning
// Shows that eigenvalue is the scaling factor along eigenvector
const eigenvalueMeaningScene = createScene(
  'eigenvalue-meaning',
  'Scaling Factors',
  'The eigenvalue λ tells you HOW MUCH the eigenvector scales. λ>1 stretches, λ<1 shrinks, λ<0 flips.',
  [
    createLayerConfig('grid', true, { size: 6, divisions: 24 }),
    createLayerConfig('axes', true, { length: 3 }),
    createLayerConfig('eigenspace', true, {}),
    createLayerConfig('vector', true, {}),
  ],
  {
    controls: [
      { type: 'matrix', id: 'main-matrix', params: {} },
      { type: 'vector', id: 'eigenvector-test', label: 'Test', params: {} },
    ],
    invariants: [
      { type: 'eigenvalues', position: 'sidebar', highlight: true },
      { type: 'determinant', position: 'sidebar', highlight: false },
    ],
    setup: (state: AppState) => {
      state.showEigenspace = true;
      state.showVector = true;
      // Set custom vector to an eigenvector direction
      state.customVector = [1, 0, 0];
    },
    update: (_state: AppState, _dt: number) => {},
    teardown: (_state: AppState) => {},
  }
);

// Module 05: Eigenvalues & Eigenvectors
export const module05: Module = {
  id: 'eigenvalues',
  title: 'Eigenvalues & Eigenvectors',
  description: 'Discover the invariant directions of linear transformations. See how eigenvalues measure scaling and how the power method finds dominant eigenvectors.',
  prerequisites: ['matrices-as-maps'],
  scenes: [eigenvectorDiscoveryScene, powerMethodScene, eigenvalueMeaningScene],
  conceptConnections: [
    {
      targetModule: 'matrices-as-maps',
      relationship: 'extends',
      description: 'Eigenvectors reveal the fundamental structure of any linear transformation',
    },
    {
      targetModule: 'diagonalization',
      relationship: 'prerequisite',
      description: 'Eigenvectors form the basis for diagonalization',
    },
  ],
};

export default module05;
