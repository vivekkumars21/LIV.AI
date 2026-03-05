# Premium Advanced Spatial Analyzer Redesign

## UI Philosophy
We aim to transition from a sterile, data-heavy layout to an immersive, AI-native premium experience. Inspiration from modern tech portals (Vercel, OpenAI, Apple) utilizing glassmorphism, depth, glowing accents, and fluid transitions.

## Key Directives
1. **Glass UX & Frosted Translucent Backgrounds**: Utilize `backdrop-blur` heavily on cards and modals alongside low-opacity backgrounds (`bg-gray-950/40`, `bg-black/60`).
2. **Neon/Holographic Accents**: Interactive elements and highlights will use vibrant, soft glowing gradients (e.g., Violet to Cyan or Emerald to Emerald-500).
3. **Skeleton & Loader Upgrades**: Loading states must look like futuristic scanning patterns, not basic spinners. 
4. **Interactive Mini-Map**: The 2D map becomes an interactive, radar-like component with sweeping animations.
5. **Modern Topography**: Use Next.JS optimized fonts and better tracking/leading for an airy feel.

## Architecture & Code Changes

### 1. Root Layout / Wrapper (`page.tsx`)
- Implement a radical background (deep mesh or animated radial gradients).
- Refactor the header to a sleek, frosted floating island at the top instead of a flat div.

### 2. Image Uploader (`index.tsx`)
- Evolve the basic dropzone to a glowing, dashed area with hover scale effects.
- Add micro-animations during the "Analyzing" state with moving gradient borders representing "AI thought".

### 3. Spatial Placement Core (`spatial-placement.tsx`)
- Complete refactor to a 2-column or 3-column Grid Layout.
- **Top Metrics Bar**: Server health and tools on a floating glass bar.
- **Main Engine Screen**: The depth/detection views must look like an advanced HUD (Heads Up Display).
- **Control Panel**: The furniture picker and calibration tool should use custom designed UI rather than native `<select>` or unstyled `<input>`.
- **Canvas Overlay**: Calibration points should pulse. Mini-map glows. Budget analysis uses animated number components.

## Technical Details
- Tailwind CSS `group-hover` and `hover:scale-105` transitions.
- Internal component breaking: We will break the monolithic `spatial-placement.tsx` structurally via well-documented React components (within the file or sub-components) using `next/image` and standard React state.
- Will execute `npm i framer-motion` and `lucide-react` (if missing, though lucide is present) for the fluid animations.
- Formatting cleanly with `npm run format`.