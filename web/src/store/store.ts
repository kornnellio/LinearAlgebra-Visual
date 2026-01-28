import { AppState, createInitialState, Vector3 } from '../types/state.js';
import { LayerConfig } from '../types/module.js';

// Action types
export type ActionType =
  | 'SET_MATRIX'
  | 'SET_ACTIVE_MATRIX'
  | 'SET_TARGET_MATRIX'
  | 'SET_CURRENT_MATRIX'
  | 'SET_ANIMATION_PROGRESS'
  | 'SET_PLAYING'
  | 'SET_ANIMATION_SPEED'
  | 'SET_CAMERA'
  | 'SET_LAYER_VISIBILITY'
  | 'SET_VECTOR'
  | 'SET_CUSTOM_VECTOR'
  | 'UPDATE_INVARIANTS'
  | 'ADD_TRAIL_POINT'
  | 'CLEAR_TRAIL'
  | 'LOAD_MODULE'
  | 'SET_SCENE_INDEX'
  | 'SET_RENDERER'
  | 'SET_CANVAS'
  | 'SET_DRAGGING'
  | 'SET_LAST_MOUSE';

// Action interface
export interface Action {
  type: ActionType;
  payload?: unknown;
}

// Listener type
export type Listener = (state: AppState) => void;

// Store class with subscription pattern
export class Store {
  private state: AppState;
  private listeners: Set<Listener> = new Set();

  constructor(initialState?: Partial<AppState>) {
    this.state = { ...createInitialState(), ...initialState };
  }

  getState(): AppState {
    return this.state;
  }

  // Subscribe to state changes
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  // Dispatch an action to update state
  dispatch(action: Action): void {
    const newState = this.reduce(this.state, action);
    if (newState !== this.state) {
      this.state = newState;
      this.notify();
    }
  }

  // Pure reducer function
  private reduce(state: AppState, action: Action): AppState {
    switch (action.type) {
      case 'SET_MATRIX': {
        const { id, matrix } = action.payload as { id: string; matrix: Float32Array };
        const matrices = new Map(state.matrices);
        matrices.set(id, matrix);
        return { ...state, matrices };
      }

      case 'SET_ACTIVE_MATRIX': {
        const id = action.payload as string;
        return { ...state, activeMatrix: id };
      }

      case 'SET_TARGET_MATRIX': {
        const matrix = action.payload as Float32Array;
        return { ...state, targetMatrix: matrix };
      }

      case 'SET_CURRENT_MATRIX': {
        const matrix = action.payload as Float32Array;
        return { ...state, currentMatrix: matrix };
      }

      case 'SET_ANIMATION_PROGRESS': {
        const progress = action.payload as number;
        return { ...state, animationProgress: progress };
      }

      case 'SET_PLAYING': {
        const isPlaying = action.payload as boolean;
        return { ...state, isPlaying };
      }

      case 'SET_ANIMATION_SPEED': {
        const speed = action.payload as number;
        return { ...state, animationSpeed: speed };
      }

      case 'SET_CAMERA': {
        const { theta, phi, distance } = action.payload as { theta?: number; phi?: number; distance?: number };
        return {
          ...state,
          cameraTheta: theta ?? state.cameraTheta,
          cameraPhi: phi ?? state.cameraPhi,
          cameraDistance: distance ?? state.cameraDistance,
        };
      }

      case 'SET_LAYER_VISIBILITY': {
        const { layerId, visible } = action.payload as { layerId: string; visible: boolean };
        const layers = new Map(state.layers);
        const layer = layers.get(layerId);
        if (layer) {
          layers.set(layerId, { ...layer, visible });
        }
        // Also update legacy flags
        const legacyUpdates: Partial<AppState> = {};
        if (layerId === 'grid') legacyUpdates.showGrid = visible;
        if (layerId === 'cube') legacyUpdates.showCube = visible;
        if (layerId === 'basis') legacyUpdates.showBasis = visible;
        if (layerId === 'vector') legacyUpdates.showVector = visible;
        return { ...state, layers, ...legacyUpdates };
      }

      case 'SET_VECTOR': {
        const { id, vector } = action.payload as { id: string; vector: Vector3 };
        const vectors = new Map(state.vectors);
        vectors.set(id, vector);
        return { ...state, vectors };
      }

      case 'SET_CUSTOM_VECTOR': {
        const vector = action.payload as Vector3;
        const vectors = new Map(state.vectors);
        vectors.set('input', vector);
        return { ...state, vectors, customVector: vector };
      }

      case 'UPDATE_INVARIANTS': {
        const invariants = action.payload as AppState['invariants'];
        return { ...state, invariants };
      }

      case 'ADD_TRAIL_POINT': {
        const point = action.payload as Float32Array;
        const trail = [...state.iterationTrail, point];
        if (trail.length > state.maxTrailLength) {
          trail.shift();
        }
        return { ...state, iterationTrail: trail };
      }

      case 'CLEAR_TRAIL': {
        return { ...state, iterationTrail: [] };
      }

      case 'LOAD_MODULE': {
        const moduleId = action.payload as string;
        return { ...state, currentModule: moduleId, currentSceneIndex: 0 };
      }

      case 'SET_SCENE_INDEX': {
        const index = action.payload as number;
        return { ...state, currentSceneIndex: index };
      }

      case 'SET_RENDERER': {
        const renderer = action.payload as AppState['renderer'];
        return { ...state, renderer };
      }

      case 'SET_CANVAS': {
        const canvas = action.payload as HTMLCanvasElement;
        return { ...state, canvas };
      }

      case 'SET_DRAGGING': {
        const isDragging = action.payload as boolean;
        return { ...state, isDragging };
      }

      case 'SET_LAST_MOUSE': {
        const { x, y } = action.payload as { x: number; y: number };
        return { ...state, lastMouseX: x, lastMouseY: y };
      }

      default:
        return state;
    }
  }

  // Batch multiple updates
  batch(actions: Action[]): void {
    let newState = this.state;
    for (const action of actions) {
      newState = this.reduce(newState, action);
    }
    if (newState !== this.state) {
      this.state = newState;
      this.notify();
    }
  }
}

// Global store instance
let globalStore: Store | null = null;

export function getStore(): Store {
  if (!globalStore) {
    globalStore = new Store();
  }
  return globalStore;
}

export function initStore(initialState?: Partial<AppState>): Store {
  globalStore = new Store(initialState);
  return globalStore;
}
