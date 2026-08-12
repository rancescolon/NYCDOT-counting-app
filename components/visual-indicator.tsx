"use client"

import { useRef, useEffect, useCallback } from "react"
import { Stroke, Point } from "@/lib/types/types"

interface VideoOverlayProps {
    isDrawingMode: boolean
    strokes: Stroke[]
    onAddStroke: (stroke: Stroke) => void
}

export function VisualIndicator({ isDrawingMode, strokes, onAddStroke }: VideoOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isDrawingRef = useRef(false)
    const currentPathRef = useRef<Point[]>([])

    const draw = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = "#FF262D"
        ctx.lineWidth = 4
        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        // Draw saved strokes
        strokes.forEach((stroke) => {
            if (stroke.points.length < 2) return
            ctx.beginPath()
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
            ctx.lineTo(stroke.points[1].x, stroke.points[1].y)
            ctx.stroke()
        })

        // Draw active path dynamically as a perfectly straight rubber-band line
        if (currentPathRef.current.length > 1) {
            ctx.beginPath()
            const startPoint = currentPathRef.current[0]
            const currentPoint = currentPathRef.current[currentPathRef.current.length - 1]

            ctx.moveTo(startPoint.x, startPoint.y)
            ctx.lineTo(currentPoint.x, currentPoint.y)
            ctx.stroke()
        }
    }, [strokes])

    useEffect(() => { draw() }, [draw])

    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                // Use getBoundingClientRect for exact sub-pixel layout alignment
                const rect = canvasRef.current.getBoundingClientRect()
                canvasRef.current.width = rect.width
                canvasRef.current.height = rect.height
                draw()
            }
        }
        window.addEventListener("resize", handleResize)
        // Small delay to ensure flexbox paints completely before measuring
        setTimeout(handleResize, 50)
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

        // Auto-straighten: Snap line to first and last points only
        if (currentPathRef.current.length > 1) {
            const startPoint = currentPathRef.current[0]
            const endPoint = currentPathRef.current[currentPathRef.current.length - 1]

            // Prevent saving microscopic accidental dots
            const distance = Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y)
            if (distance > 5) {
                onAddStroke({
                    id: Date.now().toString(),
                    points: [startPoint, endPoint]
                })
            }
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