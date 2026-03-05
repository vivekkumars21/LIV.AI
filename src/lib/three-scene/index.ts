/**
 * Three.js Scene Engine — barrel exports
 */

export { SceneManager } from "./scene-manager";
export type { SceneManagerOptions } from "./scene-manager";

export { FirstPersonControls } from "./first-person-controls";
export type { FirstPersonOptions } from "./first-person-controls";

export { RoomBuilder, THEMES } from "./room-builder";
export type { RoomData, ThemeConfig } from "./room-builder";

export {
  FurnitureManager,
  FURNITURE_CATALOG,
  FURNITURE_CATEGORIES,
} from "./furniture-manager";
export type {
  FurnitureItem,
  PlacedFurniture,
} from "./furniture-manager";

export { LightingManager } from "./lighting-manager";
export type { LightingOptions } from "./lighting-manager";
