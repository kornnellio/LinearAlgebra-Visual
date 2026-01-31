import { Module, createLayerConfig, createScene } from '../../types/module.js';
import { AppState } from '../../types/state.js';

// Scene 1: What is an Affine Combination?
const affineCombinationBasicsScene = createScene(
  'affine-basics',
  'Affine Combinations',
  'An affine combination is a weighted sum of points where weights sum to 1: R = w₁P₁ + w₂P₂ + w₃P₃ + w₄P₄. The result always lies in the affine hull.',
  [
    createLayerConfig('grid', true, { size: 6, divisions: 24 }),
    createLayerConfig('axes', true, { length: 3 }),
    createLayerConfig('custom', true, { type: 'affine' }),
  ],
  {
    controls: [
      { type: 'vector', id: 'p1', label: 'P1', params: {} },
      { type: 'vector', id: 'p2', label: 'P2', params: {} },
      { type: 'vector', id: 'p3', label: 'P3', params: {} },
      { type: 'vector', id: 'p4', label: 'P4', params: {} },
      { type: 'slider', id: 'w1', label: 'w1', params: { min: -1, max: 2 } },
      { type: 'slider', id: 'w2', label: 'w2', params: { min: -1, max: 2 } },
      { type: 'slider', id: 'w3', label: 'w3', params: { min: -1, max: 2 } },
    ],
    invariants: [],
    setup: (state: AppState) => {
      state.showAffineHull = true;
      state.showAffineResult = true;
      state.showAffinePoints = true;
      state.showGrid = true;
    },
    update: (_state: AppState, _dt: number) => {},
    teardown: (_state: AppState) => {},
  }
);

// Scene 2: The Affine Hull
const affineHullScene = createScene(
  'affine-hull',
  'The Affine Hull',
  'The affine hull is the smallest affine subspace containing the points. It can be a point (dim 0), line (dim 1), plane (dim 2), or full 3D space (dim 3).',
  [
    createLayerConfig('grid', true, { size: 6, divisions: 24 }),
    createLayerConfig('axes', true, { length: 3 }),
    createLayerConfig('custom', true, { type: 'affine' }),
  ],
  {
    controls: [
      { type: 'vector', id: 'p1', label: 'P1', params: {} },
      { type: 'vector', id: 'p2', label: 'P2', params: {} },
      { type: 'vector', id: 'p3', label: 'P3', params: {} },
      { type: 'vector', id: 'p4', label: 'P4', params: {} },
    ],
    invariants: [],
    setup: (state: AppState) => {
      state.showAffineHull = true;
      state.showAffineResult = false;
      state.showAffinePoints = true;
    },
    update: (_state: AppState, _dt: number) => {},
    teardown: (_state: AppState) => {},
  }
);

// Scene 3: Negative Weights - Beyond the Convex Hull
const negativeWeightsScene = createScene(
  'negative-weights',
  'Beyond the Convex Hull',
  'With negative weights, the result can lie OUTSIDE the convex hull but still in the affine hull. This is the key difference between affine and convex combinations.',
  [
    createLayerConfig('grid', true, { size: 6, divisions: 24 }),
    createLayerConfig('axes', true, { length: 3 }),
    createLayerConfig('custom', true, { type: 'affine' }),
  ],
  {
    controls: [
      { type: 'slider', id: 'w1', label: 'w1', params: { min: -1, max: 2 } },
      { type: 'slider', id: 'w2', label: 'w2', params: { min: -1, max: 2 } },
      { type: 'slider', id: 'w3', label: 'w3', params: { min: -1, max: 2 } },
    ],
    invariants: [],
    setup: (state: AppState) => {
      state.showAffineHull = true;
      state.showAffineResult = true;
      state.showAffinePoints = true;
      // Set up a configuration where negative weights can be explored
      state.affinePoints = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, 0]];
      state.affineWeights = [0.5, 0.5, 0.5]; // w4 = -0.5 (negative)
    },
    update: (_state: AppState, _dt: number) => {},
    teardown: (_state: AppState) => {},
  }
);

// Module 07: Affine Combinations
export const module07: Module = {
  id: 'affine-combinations',
  title: 'Affine Combinations',
  description: 'Explore weighted combinations of points where weights sum to 1. Visualize the affine hull and see how negative weights extend beyond the convex hull.',
  prerequisites: ['matrices-as-maps'],
  scenes: [affineCombinationBasicsScene, affineHullScene, negativeWeightsScene],
  conceptConnections: [
    {
      targetModule: 'matrices-as-maps',
      relationship: 'applies',
      description: 'Affine transformations preserve affine combinations',
    },
    {
      targetModule: 'convex-combinations',
      relationship: 'extends',
      description: 'Convex combinations are affine combinations with non-negative weights',
    },
  ],
};

export default module07;
