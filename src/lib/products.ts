export interface Product {
  id: string;
  name: string;
  category: 'eyeglasses' | 'sunglasses';
  price: number;
  image: string;
  description: string;
  frameWidth: number; // in mm, for AR sizing
  modelUrl?: string;
  modelOffset?: { x?: number; y?: number; z?: number; scale?: number; rotation?: number };
  color: string;
  material: string;
  discount?: number;
}

export const products: Product[] = [
  {
    id: 'axis-clear',
    name: 'AXIS',
    category: 'eyeglasses',
    price: 395000,
    image: '/images/axis-clear.png',
    description: 'Classic rectangular frame with timeless appeal',
    frameWidth: 145,
    modelUrl: '/models3D/glasses1.glb',
    modelOffset: { x: 0, y: -10, z: 0, scale: 1 },
    color: 'Tortoiseshell',
    material: 'Acetate',
  },
  {
    id: 'oscar-clear',
    name: 'OSCAR',
    category: 'eyeglasses',
    price: 1036000,
    image: '/images/oscar-clear.png',
    description: 'Premium round frame with refined geometry',
    frameWidth: 150,
    modelUrl: '/models3D/glasses2.glb',
    modelOffset: { x: 0, y: -12, z: 0, scale: 1.05 },
    color: 'Black',
    material: 'Acetate',
    discount: 20,
  },
  {
    id: 'filmore-clear',
    name: 'FILMORE',
    category: 'eyeglasses',
    price: 1036000,
    image: '/images/filmore-clear.png',
    description: 'Bold square frame for modern aesthetics',
    frameWidth: 148,
    color: 'Black',
    material: 'Acetate',
  },
  {
    id: 'atlas-clear',
    name: 'ATLAS',
    category: 'eyeglasses',
    price: 195000,
    image: '/images/atlas-clear.png',
    description: 'Minimalist frame with clean lines',
    frameWidth: 140,
    modelUrl: '/models3D/glasses1.glb',
    modelOffset: { x: 0, y: -8, z: 0, scale: 0.98 },
    color: 'Silver',
    material: 'Metal',
  },
  {
    id: 'axis-sun',
    name: 'AXIS',
    category: 'sunglasses',
    price: 395000,
    image: '/images/axis-sun.png',
    description: 'Classic sunglasses with dark lenses',
    frameWidth: 145,
    modelUrl: '/models3D/glasses2.glb',
    modelOffset: { x: 0, y: -11, z: 0, scale: 1 },
    color: 'Black',
    material: 'Acetate',
  },
  {
    id: 'oscar-sun',
    name: 'OSCAR',
    category: 'sunglasses',
    price: 1036000,
    image: '/images/oscar-sun.png',
    description: 'Premium round sunglasses',
    frameWidth: 150,
    color: 'Dark Blue',
    material: 'Acetate',
    discount: 20,
  },
  {
    id: 'filmore-sun',
    name: 'FILMORE',
    category: 'sunglasses',
    price: 647500,
    image: '/images/filmore-sun.png',
    description: 'Bold square sunglasses',
    frameWidth: 148,
    color: 'Forest Green',
    material: 'Acetate',
  },
  {
    id: 'breakaway-sun',
    name: 'BREAKAWAY',
    category: 'sunglasses',
    price: 495000,
    image: '/images/breakaway-sun.png',
    description: 'Oversized sunglasses for maximum coverage',
    frameWidth: 155,
    color: 'Dark Teal',
    material: 'Acetate',
    discount: 50,
  },
];

export const getProductsByCategory = (category: 'eyeglasses' | 'sunglasses') => {
  return products.filter((p) => p.category === category);
};

export const getProductById = (id: string) => {
  return products.find((p) => p.id === id);
};
