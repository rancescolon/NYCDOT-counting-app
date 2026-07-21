"use client"

import React, { useRef, useState, useEffect } from "react"

interface Stroke {
  id: string
  points: { x: number; y: number }[]
}

interface VideoOverlayProps {
  isDrawingMode: boolean
  strokes: Stroke[]
  onAddStroke: (stroke: Stroke) => void
}

export function VideoOverlay({ isDrawingMode, strokes, onAddStroke }: VideoOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect
        canvas.width = width
        canvas.height = height
        setCanvasSize({ width, height })
      }
    })

    resizeObserver.observe(canvas)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.lineWidth = 4
    ctx.strokeStyle = "#FF262D"
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Pass the width and height into the draw function to scale the percentages
    strokes.forEach(stroke => drawLine(ctx, stroke.points, canvas.width, canvas.height))

    if (currentPoints.length > 0) {
      drawLine(ctx, currentPoints, canvas.width, canvas.height)
    }
  }, [strokes, currentPoints, canvasSize])

  // FIX: Multiply the normalized percentages (0-1) by the actual canvas dimensions
  const drawLine = (ctx: CanvasRenderingContext2D, points: {x: number, y: number}[], width: number, height: number) => {
    if (points.length < 2) return
    ctx.beginPath()
    ctx.moveTo(points[0].x * width, points[0].y * height)
    points.forEach(p => ctx.lineTo(p.x * width, p.y * height))
    ctx.stroke()
  }

  // FIX: Store coordinates as percentages of the canvas size rather than absolute pixels
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode) return
    setIsDrawing(true)
    setCurrentPoints([getMousePos(e)])
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingMode) return
    setCurrentPoints(prev => [...prev, getMousePos(e)])
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    if (currentPoints.length > 1) {
      onAddStroke({
        id: Date.now().toString(),
        points: currentPoints
      })
    }
    setCurrentPoints([])
  }

  return (
      <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full z-10 touch-none"
          style={{
            pointerEvents: isDrawingMode ? "auto" : "none",
            cursor: isDrawingMode ? "crosshair" : "default"
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
      />
  )
}

export default VideoOverlay