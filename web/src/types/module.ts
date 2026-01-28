import type { AppState } from './state.js';

// Layer configuration for scene composition
export type LayerType = 'grid' | 'axes' | 'basis' | 'cube' | 'vector' | 'eigenspace' | 'trail' | 'custom';

export interface LayerConfig {
  type: LayerType;
  visible: boolean;
  params: Record<string, unknown>;
}

// Control types for scene-specific UI
export type ControlType = 'matrix' | 'vector' | 'slider' | 'checkbox' | 'preset' | 'button';

export interface ControlConfig {
  type: ControlType;
  id: string;
  label?: string;
  params: Record<string, unknown>;
}

// Invariant display configuration
export type InvariantType = 'determinant' | 'trace' | 'rank' | 'eigenvalues' | 'singular_values';

export interface InvariantDisplay {
  type: InvariantType;
  position: 'sidebar' | 'overlay';
  highlight: boolean;
}

// Scene definition - atomic unit of visualization
export interface Scene {
  id: string;
  title: string;
  description: string;
  layers: LayerConfig[];
  controls: ControlConfig[];
  invariants: InvariantDisplay[];
  setup: (state: AppState) => void;
  update: (state: AppState, dt: number) => void;
  teardown: (state: AppState) => void;
}

// Concept connections for curriculum navigation
export interface ConceptConnection {
  targetModule: string;
  relationship: 'prerequisite' | 'extends' | 'applies' | 'contrasts';
  description: string;
}

// Module definition - collection of related scenes
export interface Module {
  id: string;
  title: string;
  description: string;
  prerequisites: string[];
  scenes: Scene[];
  conceptConnections: ConceptConnection[];
}

// Module info for navigation (lightweight)
export interface ModuleInfo {
  id: string;
  title: string;
  description: string;
  prerequisites: string[];
  sceneCount: number;
}

// Helper to create a default layer config
export function createLayerConfig(type: LayerType, visible = true, params: Record<string, unknown> = {}): LayerConfig {
  return { type, visible, params };
}

// Helper to create a basic scene
export function createScene(
  id: string,
  title: string,
  description: string,
  layers: LayerConfig[],
  options: Partial<Pick<Scene, 'controls' | 'invariants' | 'setup' | 'update' | 'teardown'>> = {}
): Scene {
  return {
    id,
    title,
    description,
    layers,
    controls: options.controls ?? [],
    invariants: options.invariants ?? [],
    setup: options.setup ?? (() => {}),
    update: options.update ?? (() => {}),
    teardown: options.teardown ?? (() => {}),
  };
}
