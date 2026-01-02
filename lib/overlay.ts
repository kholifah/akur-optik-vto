/**
 * Face overlay math helper.
 *
 * Input:
 * - Left eye position
 * - Right eye position
 * - Nose bridge position
 *
 * Output:
 * - x, y position
 * - scale based on eye distance
 * - rotation angle
 *
 * Used to:
 * - Resize glasses to match face width
 * - Keep frame proportional
 */
export type OverlayTransform = {
	x: number
	y: number
	scale: number
	rotation: number
	eyeDistance: number
}

/**
 * Compute a simple overlay transform from three landmark points.
 * Falls back to reasonable defaults when data is noisy.
 */
export function computeTransformFromEyes(
	left: [number, number],
	right: [number, number],
	bridge?: [number, number],
	frameWidthMm?: number
): OverlayTransform {
	const lx = left[0]
	const ly = left[1]
	const rx = right[0]
	const ry = right[1]

	const cx = (lx + rx) / 2
	const cy = (ly + ry) / 2

	const dx = rx - lx
	const dy = ry - ly
	const eyeDist = Math.hypot(dx, dy) || 1

	// scale: relative to face width detected. If frameWidthMm is provided, scale to match product frame size.
	// Average face interpupillary distance is ~65mm; detected eye distance should scale proportionally.
	const referenceDist = frameWidthMm ? (frameWidthMm * 0.6) : 65 // assume eye dist is 60% of frame width
	const scale = eyeDist / referenceDist * 0.8 // 0.8 is a fine-tuning factor for visual balance

	const rotation = (Math.atan2(dy, dx) * 180) / Math.PI

	// If a nose bridge is provided, bias y toward it for better vertical placement.
	const ny = bridge ? bridge[1] : cy
	const y = (cy + ny) / 2

	return { x: cx, y, scale, rotation, eyeDistance: eyeDist }
}
