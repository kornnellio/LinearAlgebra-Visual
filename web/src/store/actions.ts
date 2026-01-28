import { Action } from './store.js';
import { AppState, Vector3, Invariants } from '../types/state.js';
import { Renderer } from '../../pkg/visual_algebra_core.js';

// Matrix actions
export function setMatrix(id: string, matrix: Float32Array): Action {
  return { type: 'SET_MATRIX', payload: { id, matrix } };
}

export function setActiveMatrix(id: string): Action {
  return { type: 'SET_ACTIVE_MATRIX', payload: id };
}

export function setTargetMatrix(matrix: Float32Array): Action {
  return { type: 'SET_TARGET_MATRIX', payload: matrix };
}

export function setCurrentMatrix(matrix: Float32Array): Action {
  return { type: 'SET_CURRENT_MATRIX', payload: matrix };
}

// Animation actions
export function setAnimationProgress(progress: number): Action {
  return { type: 'SET_ANIMATION_PROGRESS', payload: progress };
}

export function setPlaying(isPlaying: boolean): Action {
  return { type: 'SET_PLAYING', payload: isPlaying };
}

export function setAnimationSpeed(speed: number): Action {
  return { type: 'SET_ANIMATION_SPEED', payload: speed };
}

export function play(): Action {
  return setPlaying(true);
}

export function pause(): Action {
  return setPlaying(false);
}

export function resetAnimation(): Action {
  return setAnimationProgress(0);
}

// Camera actions
export function setCamera(params: { theta?: number; phi?: number; distance?: number }): Action {
  return { type: 'SET_CAMERA', payload: params };
}

export function setCameraTheta(theta: number): Action {
  return setCamera({ theta });
}

export function setCameraPhi(phi: number): Action {
  return setCamera({ phi });
}

export function setCameraDistance(distance: number): Action {
  return setCamera({ distance });
}

// Layer visibility actions
export function setLayerVisibility(layerId: string, visible: boolean): Action {
  return { type: 'SET_LAYER_VISIBILITY', payload: { layerId, visible } };
}

export function showLayer(layerId: string): Action {
  return setLayerVisibility(layerId, true);
}

export function hideLayer(layerId: string): Action {
  return setLayerVisibility(layerId, false);
}

export function toggleLayer(layerId: string, currentlyVisible: boolean): Action {
  return setLayerVisibility(layerId, !currentlyVisible);
}

// Vector actions
export function setVector(id: string, vector: Vector3): Action {
  return { type: 'SET_VECTOR', payload: { id, vector } };
}

export function setCustomVector(vector: Vector3): Action {
  return { type: 'SET_CUSTOM_VECTOR', payload: vector };
}

// Invariant actions
export function updateInvariants(invariants: Invariants): Action {
  return { type: 'UPDATE_INVARIANTS', payload: invariants };
}

// Trail actions
export function addTrailPoint(point: Float32Array): Action {
  return { type: 'ADD_TRAIL_POINT', payload: point };
}

export function clearTrail(): Action {
  return { type: 'CLEAR_TRAIL' };
}

// Module/scene navigation actions
export function loadModule(moduleId: string): Action {
  return { type: 'LOAD_MODULE', payload: moduleId };
}

export function setSceneIndex(index: number): Action {
  return { type: 'SET_SCENE_INDEX', payload: index };
}

export function nextScene(currentIndex: number, maxIndex: number): Action {
  const next = Math.min(currentIndex + 1, maxIndex);
  return setSceneIndex(next);
}

export function prevScene(currentIndex: number): Action {
  const prev = Math.max(currentIndex - 1, 0);
  return setSceneIndex(prev);
}

// Renderer/canvas setup actions
export function setRenderer(renderer: Renderer): Action {
  return { type: 'SET_RENDERER', payload: renderer };
}

export function setCanvas(canvas: HTMLCanvasElement): Action {
  return { type: 'SET_CANVAS', payload: canvas };
}

// Mouse interaction actions
export function setDragging(isDragging: boolean): Action {
  return { type: 'SET_DRAGGING', payload: isDragging };
}

export function setLastMouse(x: number, y: number): Action {
  return { type: 'SET_LAST_MOUSE', payload: { x, y } };
}

// Compound action creators (return arrays for batch dispatch)
export function applyPresetMatrix(preset: string, identityMatrix: Float32Array, presetMatrix: Float32Array): Action[] {
  return [
    setTargetMatrix(presetMatrix),
    setCurrentMatrix(identityMatrix),
    setAnimationProgress(0),
  ];
}

export function initializeRenderer(renderer: Renderer, canvas: HTMLCanvasElement): Action[] {
  return [
    setRenderer(renderer),
    setCanvas(canvas),
  ];
}
