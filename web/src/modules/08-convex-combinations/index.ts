import { Module, createLayerConfig, createScene } from '../../types/module.js';
import { AppState } from '../../types/state.js';

// Scene 1: What is a Convex Combination?
const convexCombinationBasicsScene = createScene(
  'convex-basics',
  'Convex Combinations',
  'A convex combination is a weighted sum of points where weights sum to 1 AND all weights are non-negative: R = w₁P₁ + w₂P₂ + w₃P₃. The result always lies inside or on the boundary of the convex hull.',
  [
    createLayerConfig('grid', true, { size: 6, divisions: 24 }),
    createLayerConfig('axes', true, { length: 3 }),
    createLayerConfig('custom', true, { type: 'convex' }),
  ],
  {
    controls: [
      { type: 'vector', id: 'p1', label: 'P1', params: {} },
      { type: 'vector', id: 'p2', label: 'P2', params: {} },
      { type: 'vector', id: 'p3', label: 'P3', params: {} },
      { type: 'slider', id: 'w1', label: 'w1', params: { min: 0, max: 1 } },
      { type: 'slider', id: 'w2', label: 'w2', params: { min: 0, max: 1 } },
    ],
    invariants: [],
    setup: (state: AppState) => {
      state.showConvexHull = true;
      state.showConvexResult = true;
      state.showConvexPoints = true;
      state.showGrid = true;
      // Initialize with a simple triangle
      state.convexPoints = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      state.convexWeights = [0.33, 0.33, 0.34];
    },
    update: (_state: AppState, _dt: number) => {},
    teardown: (_state: AppState) => {},
  }
);

// Scene 2: The Convex Hull
const convexHullScene = createScene(
  'convex-hull',
  'The Convex Hull',
  'The convex hull is the smallest convex set containing all the points. Think of it as stretching a rubber band around the points. Any convex combination lies inside this region.',
  [
    createLayerConfig('grid', true, { size: 6, divisions: 24 }),
    createLayerConfig('axes', true, { length: 3 }),
    createLayerConfig('custom', true, { type: 'convex' }),
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
      state.showConvexHull = true;
      state.showConvexResult = false;
      state.showConvexPoints = true;
      // Tetrahedron vertices
      state.convexPoints = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    },
    update: (_state: AppState, _dt: number) => {},
    teardown: (_state: AppState) => {},
  }
);

// Scene 3: Barycentric Coordinates
const barycentricScene = createScene(
  'barycentric',
  'Barycentric Coordinates',
  'Every point inside a triangle can be uniquely expressed as a convex combination of the vertices. The weights (w₁, w₂, w₃) are called barycentric coordinates and represent the "influence" of each vertex.',
  [
    createLayerConfig('grid', true, { size: 6, divisions: 24 }),
    createLayerConfig('axes', true, { length: 3 }),
    createLayerConfig('custom', true, { type: 'convex' }),
  ],
  {
    controls: [
      { type: 'slider', id: 'w1', label: 'w1', params: { min: 0, max: 1 } },
      { type: 'slider', id: 'w2', label: 'w2', params: { min: 0, max: 1 } },
    ],
    invariants: [],
    setup: (state: AppState) => {
      state.showConvexHull = true;
      state.showConvexResult = true;
      state.showConvexPoints = true;
      // Fixed triangle in the XY plane for clear visualization
      state.convexPoints = [[2, 0, 0], [-1, 1.73, 0], [-1, -1.73, 0]];
      state.convexWeights = [0.33, 0.33, 0.34]; // Center of triangle
    },
    update: (_state: AppState, _dt: number) => {},
    teardown: (_state: AppState) => {},
  }
);

// Module 08: Convex Combinations
export const module08: Module = {
  id: 'convex-combinations',
  title: 'Convex Combinations',
  description: 'Explore weighted combinations of points where weights sum to 1 and are all non-negative. Visualize the convex hull and understand barycentric coordinates.',
  prerequisites: ['affine-combinations'],
  scenes: [convexCombinationBasicsScene, convexHullScene, barycentricScene],
  conceptConnections: [
    {
      targetModule: 'affine-combinations',
      relationship: 'contrasts',
      description: 'Convex combinations are affine combinations with non-negative weights',
    },
    {
      targetModule: 'matrices-as-maps',
      relationship: 'applies',
      description: 'Linear transformations preserve convex combinations',
    },
  ],
};

export default module08;
