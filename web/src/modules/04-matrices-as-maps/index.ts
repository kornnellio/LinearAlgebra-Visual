import { Module, createLayerConfig, createScene } from '../../types/module.js';
import { AppState } from '../../types/state.js';
import { identity3 } from '../../../pkg/visual_algebra_core.js';

// Scene 1: Column Picture
// Shows how matrix columns are the images of basis vectors
const columnPictureScene = createScene(
  'column-picture',
  'Column Picture',
  'Matrix columns are transformed basis vectors. Watch how e1, e2, e3 map to the columns of the matrix.',
  [
    createLayerConfig('grid', true, { size: 6, divisions: 24 }),
    createLayerConfig('axes', true, { length: 3 }),
    createLayerConfig('basis', true, {}),
    createLayerConfig('cube', false, {}), // Hide cube to focus on basis
  ],
  {
    controls: [
      { type: 'matrix', id: 'main-matrix', params: {} },
      { type: 'preset', id: 'presets', params: { presets: ['identity', 'rotateX', 'rotateY', 'scale'] } },
    ],
    invariants: [
      { type: 'determinant', position: 'sidebar', highlight: true },
    ],
    setup: (state: AppState) => {
      // Reset to identity
      state.currentMatrix = new Float32Array(identity3());
      state.targetMatrix = new Float32Array(identity3());
      state.animationProgress = 0;
      state.showBasis = true;
      state.showCube = false;
    },
    update: (_state: AppState, _dt: number) => {
      // Animation handled by main render loop
    },
    teardown: (_state: AppState) => {
      // Nothing to clean up
    },
  }
);

// Scene 2: Transformation Gallery
// Explore different transformation types
const transformationGalleryScene = createScene(
  'transformation-gallery',
  'Transformation Gallery',
  'Explore rotation, scaling, shearing, reflection, and projection transformations.',
  [
    createLayerConfig('grid', true, { size: 6, divisions: 24 }),
    createLayerConfig('axes', true, { length: 3 }),
    createLayerConfig('basis', true, {}),
    createLayerConfig('cube', true, {}),
    createLayerConfig('vector', true, {}),
  ],
  {
    controls: [
      { type: 'matrix', id: 'main-matrix', params: {} },
      { type: 'vector', id: 'input-vector', label: 'Input', params: {} },
      { type: 'preset', id: 'presets', params: { presets: ['identity', 'rotateX', 'rotateY', 'rotateZ', 'scale', 'shear', 'reflect', 'project'] } },
    ],
    invariants: [
      { type: 'determinant', position: 'sidebar', highlight: true },
    ],
    setup: (state: AppState) => {
      state.showCube = true;
      state.showVector = true;
      state.showBasis = true;
    },
    update: (_state: AppState, _dt: number) => {
      // Animation handled by main render loop
    },
    teardown: (_state: AppState) => {
      // Nothing to clean up
    },
  }
);

// Scene 3: Composition
// Visualize A * B by showing how B transforms then A transforms
const compositionScene = createScene(
  'composition',
  'Matrix Composition',
  'See how composing transformations A * B means: first apply B, then apply A.',
  [
    createLayerConfig('grid', true, { size: 6, divisions: 24 }),
    createLayerConfig('axes', true, { length: 3 }),
    createLayerConfig('basis', true, {}),
    createLayerConfig('cube', true, {}),
  ],
  {
    controls: [
      { type: 'matrix', id: 'matrix-a', label: 'A', params: {} },
      { type: 'matrix', id: 'matrix-b', label: 'B', params: {} },
      { type: 'button', id: 'show-composition', label: 'Show A*B', params: {} },
    ],
    invariants: [
      { type: 'determinant', position: 'sidebar', highlight: true },
    ],
    setup: (state: AppState) => {
      state.showCube = true;
      state.showBasis = true;
      // Initialize secondary matrix
      if (!state.matrices.has('matrix-b')) {
        state.matrices.set('matrix-b', new Float32Array(identity3()));
      }
    },
    update: (_state: AppState, _dt: number) => {
      // Animation handled by main render loop
    },
    teardown: (_state: AppState) => {
      // Nothing to clean up
    },
  }
);

// Module 04: Matrices as Linear Maps
export const module04: Module = {
  id: 'matrices-as-maps',
  title: 'Linear Transformations',
  description: 'Understand how matrices represent linear transformations. See the column picture, explore transformation types, and visualize composition.',
  prerequisites: [], // No prerequisites - entry point module
  scenes: [columnPictureScene, transformationGalleryScene, compositionScene],
  conceptConnections: [
    {
      targetModule: 'eigenvalues',
      relationship: 'extends',
      description: 'Eigenvalues reveal the special directions preserved by a transformation',
    },
    {
      targetModule: 'determinant',
      relationship: 'applies',
      description: 'The determinant measures how the transformation scales volume',
    },
  ],
};

export default module04;
