# Akur Optic Virtual Try-On

This is a Next.js 15 App Router project using:
- TypeScript
- Tailwind CSS
- shadcn/ui
- Web-based Virtual Try-On (VTO) for eyewear

Design reference:
- https://saturdays.com
- Clean, minimal, editorial layout

Main features:
- Homepage with product grid
- Product modal with tabs (Product / Try On)
- Virtual Try-On using webcam
- Glasses overlay follows face landmarks

## Technical Notes: Mode Switching & Tracking Reset
The project implements a robust mechanism to handle switching between **3D Detail View** and **AR Try-On Mode** within the `ProductModal`.

### Reset Mechanism
To prevent inconsistent positioning (glasses appearing too small or centered between eyes), a comprehensive reset is triggered every time the AR component is unmounted or remounted:
1.  **Cleanup Function**: `WebARRocksFaceThreeHelper.clean()` is called to:
    - Clear all Three.js face slots and child objects.
    - Reset and destroy `landmarksStabilizers`.
    - Invalidate `_previousSizing` to force a camera projection update on the next frame.
    - Reset `_focals` and `_isInitialized` flags.
2.  **Lifecycle Management**: `VTOGlassesAR.tsx` uses a `useEffect` cleanup return that:
    - Pauses the `mirrorHelper`.
    - Asynchronously destroys the `WEBARROCKSFACE` instance.
    - Executes an "Emergency Cleanup" in the `.finally()` block to ensure helper states are reset even if the engine destruction fails.
3.  **Logging**: Detailed `INFO` and `ERROR` logs are provided in the browser console (prefixed with `[AR]` or `WebARRocksFaceThreeHelper`) to trace the reset lifecycle.

### Detection
Mode switching is handled via React's component lifecycle. When the user toggles between "AR" and "3D" tabs in `ProductModal.tsx`, the `VTOGlassesAR` component is unmounted, triggering the full reset sequence described above.

## Rules
- Use client components for webcam/canvas
- Keep logic modular
- Prefer readability over cleverness
