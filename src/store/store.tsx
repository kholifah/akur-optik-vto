"use client"

import React, { createContext, useContext, useReducer, ReactNode } from "react"
import type { Product } from "@/lib/products"

type CartItem = { product: Product; qty: number }

type State = {
  selectedProduct: Product | null
  isModalOpen: boolean
  cart: CartItem[]
}

type Action =
  | { type: "open"; product: Product }
  | { type: "close" }
  | { type: "add"; product: Product; qty?: number }
  | { type: "remove"; productId: string }
  | { type: "clear" }

const initialState: State = { selectedProduct: null, isModalOpen: false, cart: [] }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "open":
      return { ...state, selectedProduct: action.product, isModalOpen: true }
    case "close":
      return { ...state, isModalOpen: false }
    case "add": {
      const existing = state.cart.find((c) => c.product.id === action.product.id)
      if (existing) {
        return { ...state, cart: state.cart.map((c) => (c.product.id === action.product.id ? { ...c, qty: c.qty + (action.qty ?? 1) } : c)) }
      }
      return { ...state, cart: [...state.cart, { product: action.product, qty: action.qty ?? 1 }] }
    }
    case "remove":
      return { ...state, cart: state.cart.filter((c) => c.product.id !== action.productId) }
    case "clear":
      return { ...state, cart: [] }
    default:
      return state
  }
}

const StoreContext = createContext<State | undefined>(undefined)
const DispatchContext = createContext<React.Dispatch<Action> | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <StoreContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StoreContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useAppState must be used within StoreProvider")
  return ctx
}

export function useAppDispatch() {
  const d = useContext(DispatchContext)
  if (!d) throw new Error("useAppDispatch must be used within StoreProvider")
  return d
}

export function openModal(product: Product) {
  return { type: "open", product } as Action
}

export function closeModal() {
  return { type: "close" } as Action
}

export function addToCart(product: Product, qty = 1) {
  return { type: "add", product, qty } as Action
}

export function removeFromCart(productId: string) {
  return { type: "remove", productId } as Action
}

export function clearCart() {
  return { type: "clear" } as Action
}

export default StoreProvider
 
