"use client"

import React from "react"
import { useAppState, useAppDispatch, removeFromCart, clearCart } from "@/store"

export default function CartPage() {
  const state = useAppState()
  const dispatch = useAppDispatch()

  const total = state.cart.reduce((s, c) => s + c.qty * c.product.price, 0)

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>
      {state.cart.length === 0 ? (
        <div className="text-muted-foreground">Your cart is empty.</div>
      ) : (
        <div className="space-y-4">
          {state.cart.map((c) => (
            <div key={c.product.id} className="p-4 bg-white rounded flex items-center justify-between">
              <div>
                <div className="font-medium">{c.product.name}</div>
                <div className="text-sm text-muted-foreground">Qty: {c.qty}</div>
              </div>
              <div className="flex items-center gap-4">
                <div>Rp {(c.product.price * c.qty).toLocaleString()}</div>
                <button className="text-sm text-red-500" onClick={() => dispatch(removeFromCart(c.product.id))}>Remove</button>
              </div>
            </div>
          ))}

          <div className="p-4 bg-white rounded flex items-center justify-between">
            <div className="font-medium">Total</div>
            <div className="font-semibold">Rp {total.toLocaleString()}</div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 bg-accent text-accent-foreground px-4 py-2 rounded">Checkout</button>
            <button className="flex-1 border px-4 py-2 rounded" onClick={() => dispatch(clearCart())}>Clear</button>
          </div>
        </div>
      )}
    </div>
  )
}
