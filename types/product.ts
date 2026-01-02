/**
 * Eyewear product data structure
 *
 * Fields:
 * - id
 * - name
 * - price
 * - frameWidth
 * - lensWidth
 * - bridge
 * - temple
 * - image
 */

export type Product = {
	id: string
	name: string
	price: number
	frameWidth: number
	lensWidth: number
	bridge: number
	temple: number
	image: string
}

export default Product

