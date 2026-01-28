import { Module, createLayerConfig, createScene } from '../../types/module.js';
import { AppState } from '../../types/state.js';

// Scene 1: What Makes a Matrix Degenerate?
// Shows how rank deficiency collapses dimensions
const rankDeficiencyScene = createScene(
  'rank-deficiency',
  'Collapsing Dimensions',
  'A degenerate matrix has det = 0 and rank < 3. Watch the cube collapse into a plane, line, or point as dimensions are lost.',
  [
    createLayerConfig('grid', true, { size: 6, divisions: 24 }),
    createLayerConfig('axes', true, { length: 3 }),
    createLayerConfig('basis', true, {}),
    createLayerConfig('cube', true, {}),
  ],
  {
    controls: [
      { type: 'matrix', id: 'main-matrix', params: {} },
      { type: 'preset', id: 'degenerate-presets', params: {
        presets: ['rank2-xy', 'rank2-xz', 'rank1-x', 'rank0']
      } },
    ],
    invariants: [
      { type: 'determinant', position: 'sidebar', highlight: true },
      { type: 'rank', position: 'sidebar', highlight: true },
    ],
    setup: (state: AppState) => {
      state.showBasis = true;
      state.showCube = true;
      state.showGrid = true;
    },
    update: (_state: AppState, _dt: number) => {},
    teardown: (_state: AppState) => {},
  }
);

// Scene 2: The Null Space (Kernel)
// Shows vectors that map to zero
const nullSpaceScene = createScene(
  'null-space',
  'The Null Space',
  'The null space contains ALL vectors that map to zero. These are the "invisible" directions - they vanish under the transformation.',
  [
    createLayerConfig('grid', false, {}),
    createLayerConfig('axes', true, { length: 3 }),
    createLayerConfig('basis', false, {}),
    createLayerConfig('cube', false, {}),
    createLayerConfig('vector', true, {}),
  ],
  {
    controls: [
      { type: 'matrix', id: 'main-matrix', params: {} },
      { type: 'vector', id: 'test-vector', label: 'Test Vector', params: {} },
    ],
    invariants: [
      { type: 'rank', position: 'sidebar', highlight: true },
    ],
    setup: (state: AppState) => {
      state.customVector = [0, 0, 1];
      state.showVector = true;
      state.showNullSpace = true;
      state.showColumnSpace = false;
    },
    update: (_state: AppState, _dt: number) => {},
    teardown: (_state: AppState) => {},
  }
);

// Scene 3: Image (Column Space) vs Null Space
// Shows the rank-nullity theorem visually
const imageNullityScene = createScene(
  'image-nullity',
  'Rank-Nullity Theorem',
  'rank(A) + nullity(A) = 3. The column space (image) and null space partition the input and output spaces.',
  [
    createLayerConfig('grid', true, { size: 6, divisions: 24 }),
    createLayerConfig('axes', true, { length: 3 }),
    createLayerConfig('basis', true, {}),
    createLayerConfig('cube', false, {}),
  ],
  {
    controls: [
      { type: 'matrix', id: 'main-matrix', params: {} },
      { type: 'preset', id: 'rank-presets', params: {
        presets: ['rank3', 'rank2-xy', 'rank1-x', 'rank0']
      } },
    ],
    invariants: [
      { type: 'rank', position: 'sidebar', highlight: true },
      { type: 'determinant', position: 'sidebar', highlight: false },
    ],
    setup: (state: AppState) => {
      state.showNullSpace = true;
      state.showColumnSpace = true;
      state.showBasis = true;
    },
    update: (_state: AppState, _dt: number) => {},
    teardown: (_state: AppState) => {},
  }
);

// Module 06: Degenerate Matrices
export const module06: Module = {
  id: 'degenerate-matrices',
  title: 'Degenerate Matrices',
  description: 'Explore what happens when matrices lose dimensions. Understand rank, nullity, and how degenerate transformations collapse space.',
  prerequisites: ['matrices-as-maps'],
  scenes: [rankDeficiencyScene, nullSpaceScene, imageNullityScene],
  conceptConnections: [
    {
      targetModule: 'matrices-as-maps',
      relationship: 'extends',
      description: 'Degenerate matrices are non-invertible linear maps',
    },
    {
      targetModule: 'eigenvalues',
      relationship: 'applies',
      description: 'Degenerate matrices have at least one zero eigenvalue',
    },
  ],
};

export default module06;
