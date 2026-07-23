"use client"

import { useRef, useEffect, useCallback } from "react"
import { Stroke, Point } from "@/lib/types"

interface VideoOverlayProps {
  isDrawingMode: boolean
  strokes: Stroke[]
  onAddStroke: (stroke: Stroke) => void
}

export function VideoOverlay({ isDrawingMode, strokes, onAddStroke }: VideoOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const currentPathRef = useRef<Point[]>([])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = "rgba(59, 130, 246, 0.8)" // Primary blue
    ctx.lineWidth = 4
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Draw saved strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      stroke.points.forEach((p) => ctx.lineTo(p.x, p.y))
      ctx.stroke()
    })

    // Draw active path dynamically without triggering React state
    if (currentPathRef.current.length > 1) {
      ctx.beginPath()
      ctx.moveTo(currentPathRef.current[0].x, currentPathRef.current[0].y)
      currentPathRef.current.forEach((p) => ctx.lineTo(p.x, p.y))
      ctx.stroke()
    }
  }, [strokes])

  useEffect(() => { draw() }, [draw])

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth
        canvasRef.current.height = canvasRef.current.offsetHeight
        draw()
      }
    }
    window.addEventListener("resize", handleResize)
    handleResize()
    return () => window.removeEventListener("resize", handleResize)
  }, [draw])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDrawingMode || !canvasRef.current) return
    e.preventDefault()
    isDrawingRef.current = true
    const rect = canvasRef.current.getBoundingClientRect()
    currentPathRef.current = [{ x: e.clientX - rect.left, y: e.clientY - rect.top }]
    draw()
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawingMode || !isDrawingRef.current || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    currentPathRef.current.push({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    draw()
  }

  const handlePointerUp = () => {
    if (!isDrawingMode || !isDrawingRef.current) return
    isDrawingRef.current = false
    if (currentPathRef.current.length > 1) {
      onAddStroke({ id: Date.now().toString(), points: [...currentPathRef.current] })
    }
    currentPathRef.current = []
    draw()
  }

  return (
      <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className={`absolute inset-0 w-full h-full z-50 ${
              isDrawingMode ? "cursor-crosshair touch-none" : "pointer-events-none"
          }`}
      />
  )
}