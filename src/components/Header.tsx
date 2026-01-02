
"use client"

import React from "react"
import Link from "next/link"
import { useAppState } from "@/store"
import { useRouter } from "next/navigation"

export default function Header() {
  const state = useAppState()
  const router = useRouter()

  const count = state.cart.reduce((s, c) => s + c.qty, 0)
  const total = state.cart.reduce((s, c) => s + c.qty * c.product.price, 0)

  return (
    <header className="w-full bg-white border-b">
      <nav className="border-b border-border">
        <div className="container flex items-center justify-between h-20">
          
          {/* Logo → Home */}
          <Link
            href="/"
            className="font-serif text-2xl font-bold tracking-tight hover:opacity-80 transition"
          >
            AKUR OPTIC
          </Link>

          <div className="flex items-center gap-8">
            {/* Category navigation */}
            <button
              onClick={() => router.push("/shop?category=eyeglasses")}
              className="text-sm font-medium hover:text-accent transition-colors"
            >
              EYEGLASSES
            </button>

            <button
              onClick={() => router.push("/shop?category=sunglasses")}
              className="text-sm font-medium hover:text-accent transition-colors"
            >
              SUNGLASSES
            </button>

            <button
              onClick={() => router.push("/try-on")}
              className="text-sm font-medium hover:text-accent transition-colors"
            >
              TRY ON
            </button>

            {/* Cart */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/cart")}
                className="relative"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4"
                  />
                </svg>
                {count > 0 && (
                  <span className="absolute -right-2 -top-2 bg-accent text-white rounded-full text-xs px-2">
                    {count}
                  </span>
                )}
              </button>

              <div className="text-sm text-muted-foreground">
                Rp {total.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
