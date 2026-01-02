"use client"

import React from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function Hero() {
  return (
    <section className="border-b border-border min-h-[calc(100vh-80px)] flex items-center">
      <div className="container grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

        {/* Left content */}
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Premium Eyewear
            </p>

            <h2 className="font-serif text-5xl md:text-6xl font-bold leading-tight">
              Curated Frames for Every Face
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
              Discover our collection of premium eyewear. Try on virtually with
              our innovative AR technology before you buy.
            </p>
          </div>

          <div className="flex gap-4">
            <Button className="bg-accent text-accent-foreground px-8 py-3">
              Shop Now
            </Button>
            <Button variant="outline" className="px-8 py-3">
              Learn More
            </Button>
          </div>
        </div>

        {/* Right image */}
        <div className="flex justify-center md:justify-end">
          <div
            className="relative bg-secondary rounded-lg flex items-center justify-center overflow-hidden
                        w-full max-w-[520px]
                        h-[60vh] md:h-[70vh]"
            >
            <Image
                src="/images/hero-glasses.jpg"
                alt="Hero Glasses"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 90vw, 520px"
            />
            </div>
        </div>

      </div>
    </section>
  )
}
