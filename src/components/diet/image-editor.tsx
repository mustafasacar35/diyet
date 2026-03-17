"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, Undo, Crop, Paintbrush, ZoomIn, Loader2, Scissors } from 'lucide-react'

interface ImageEditorProps {
    imageSrc: string
    initialDescription?: string
    patientDietType?: string
    onConfirm: (croppedImageBase64: string, description: string, applyDietContext: boolean) => void
    onCancel: () => void
}

export function ImageEditor({ imageSrc, initialDescription = '', patientDietType, onConfirm, onCancel }: ImageEditorProps) {
    const [mode, setMode] = useState<'crop' | 'draw' | 'lasso'>('crop')
    const [isProcessing, setIsProcessing] = useState(false)
    const [description, setDescription] = useState(initialDescription)
    const [applyDietContext, setApplyDietContext] = useState(false)

    // Cropper State
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

    // Drawing State
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [brushSize, setBrushSize] = useState(20)
    const [brushColor, setBrushColor] = useState('#000000') // Default black

    // Lasso State
    const [lassoPath, setLassoPath] = useState<{ x: number, y: number }[]>([])

    // We need an intermediate image for drawing if the user already cropped, 
    // but to keep it simple, we'll draw on the original image, then crop, 
    // OR crop first then draw. Let's do Crop -> Draw.
    // For simplicity in a single component, we'll allow cropping first, 
    // then when switching to 'draw', we bake the crop and let them draw on it.

    const [currentImage, setCurrentImage] = useState(imageSrc)
    const [history, setHistory] = useState<string[]>([imageSrc])
    const [historyIndex, setHistoryIndex] = useState(0)

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = (e) => reject(e)
            img.src = imageSrc
        })

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        )

        return canvas.toDataURL('image/jpeg', 0.9)
    }

    const applyCrop = async () => {
        if (!croppedAreaPixels) return
        setIsProcessing(true)
        try {
            const croppedImg = await getCroppedImg(currentImage, croppedAreaPixels)
            if (croppedImg) {
                setCurrentImage(croppedImg)
                const newHistory = history.slice(0, historyIndex + 1)
                newHistory.push(croppedImg)
                setHistory(newHistory)
                setHistoryIndex(newHistory.length - 1)
                // Reset crop state
                setZoom(1)
                setCrop({ x: 0, y: 0 })
                // Switch to draw mode automatically to suggest next step, or stay in current
                setMode('draw')
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsProcessing(false)
        }
    }

    // Canvas Drawing Logic
    useEffect(() => {
        if ((mode === 'draw' || mode === 'lasso') && canvasRef.current) {
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            if (!ctx) return

            const img = new Image()
            img.onload = () => {
                // Resize canvas to fit container while maintaining aspect ratio
                const container = canvas.parentElement
                if (!container) return

                const ratio = img.width / img.height
                let newWidth = container.clientWidth
                let newHeight = newWidth / ratio

                if (newHeight > container.clientHeight) {
                    newHeight = container.clientHeight
                    newWidth = newHeight * ratio
                }

                canvas.width = img.width
                canvas.height = img.height

                // Style for display
                canvas.style.width = `${newWidth}px`
                canvas.style.height = `${newHeight}px`

                // If lasso mode and we have a path, we should draw the path as a dashed line
                // But generally, the base image is drawn first
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage(img, 0, 0)

                if (mode === 'lasso' && lassoPath.length > 0) {
                    ctx.save()
                    ctx.beginPath()
                    for (let i = 0; i < lassoPath.length; i++) {
                        if (i === 0) ctx.moveTo(lassoPath[i].x, lassoPath[i].y)
                        else ctx.lineTo(lassoPath[i].x, lassoPath[i].y)
                    }
                    if (!isDrawing) ctx.closePath()

                    ctx.lineWidth = 2 * (canvas.width / 500)
                    ctx.strokeStyle = '#ef4444' // Red dashed line for lasso indication
                    ctx.setLineDash([5, 5])
                    ctx.stroke()
                    ctx.restore()
                }
            }
            img.src = currentImage
        }
    }, [mode, currentImage, lassoPath, isDrawing])

    const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect()
        let clientX, clientY
        if ('touches' in e) {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = e.nativeEvent.clientX
            clientY = e.nativeEvent.clientY
        }

        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        }
    }

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return
        setIsDrawing(true)
        if (mode === 'lasso') {
            const coords = getCoordinates(e, canvasRef.current)
            setLassoPath([coords])
        } else {
            draw(e)
        }
    }

    const stopDrawing = () => {
        if (!isDrawing) return
        setIsDrawing(false)

        const canvas = canvasRef.current
        if (!canvas) return

        if (mode === 'lasso' && lassoPath.length > 2) {
            // Apply the lasso crop
            const ctx = canvas.getContext('2d')
            if (!ctx) return

            const img = new Image()
            img.onload = () => {
                // Clear canvas and draw only the masked area
                ctx.clearRect(0, 0, canvas.width, canvas.height)

                ctx.save()
                ctx.beginPath()
                for (let i = 0; i < lassoPath.length; i++) {
                    if (i === 0) ctx.moveTo(lassoPath[i].x, lassoPath[i].y)
                    else ctx.lineTo(lassoPath[i].x, lassoPath[i].y)
                }
                ctx.closePath()

                // Clip to the path
                ctx.clip()

                // Draw image inside the clipped area
                ctx.drawImage(img, 0, 0)
                ctx.restore()

                // Save to history
                const newImage = canvas.toDataURL('image/png', 1.0) // PNG to keep transparency if needed
                setCurrentImage(newImage)
                const newHistory = history.slice(0, historyIndex + 1)
                newHistory.push(newImage)
                setHistory(newHistory)
                setHistoryIndex(newHistory.length - 1)
                setLassoPath([]) // Reset path after applying
            }
            img.src = currentImage
            return // Skip normal draw history save
        }

        if (mode === 'draw') {
            // Save state to history for brush draws
            const newImage = canvas.toDataURL('image/jpeg', 0.9)
            setCurrentImage(newImage)
            const newHistory = history.slice(0, historyIndex + 1)
            newHistory.push(newImage)
            setHistory(newHistory)
            setHistoryIndex(newHistory.length - 1)
        }
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !canvasRef.current) return

        const canvas = canvasRef.current
        const coords = getCoordinates(e, canvas)

        if (mode === 'lasso') {
            setLassoPath(prev => [...prev, coords])
            return // Trigger re-render to show dashed line via useEffect
        }

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.lineWidth = brushSize * (canvas.width / 500)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = brushColor

        ctx.lineTo(coords.x, coords.y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(coords.x, coords.y)
    }

    // Reset path when drawing starts again
    const startNewPath = () => {
        if (canvasRef.current && mode === 'draw') {
            const ctx = canvasRef.current.getContext('2d')
            if (ctx) ctx.beginPath()
        }
    }

    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1)
            setCurrentImage(history[historyIndex - 1])
            setLassoPath([])
        }
    }

    const handleConfirm = async () => {
        // If in crop mode and haven't applied, apply it first
        if (mode === 'crop' && zoom !== 1) {
            setIsProcessing(true)
            try {
                const croppedImg = await getCroppedImg(currentImage, croppedAreaPixels)
                onConfirm(croppedImg || currentImage, description, applyDietContext)
            } catch (e) {
                onConfirm(currentImage, description, applyDietContext)
            } finally {
                setIsProcessing(false)
            }
        } else {
            onConfirm(currentImage, description, applyDietContext)
        }
    }

    return (
        <div className="flex flex-col h-[600px] max-h-[80vh] bg-white rounded-lg overflow-hidden flex-shrink-0">
            {/* Header Tabs */}
            <div className="border-b px-4 py-2 bg-gray-50 flex justify-between items-center z-10">
                <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-[300px]">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="crop" className="gap-2 text-xs">
                            <Crop size={14} /> Kırp
                        </TabsTrigger>
                        <TabsTrigger value="lasso" className="gap-2 text-xs">
                            <Scissors size={14} /> Kes
                        </TabsTrigger>
                        <TabsTrigger value="draw" className="gap-2 text-xs">
                            <Paintbrush size={14} /> Boya
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex === 0} title="Geri Al">
                        <Undo size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onCancel} className="text-gray-500">
                        <X size={16} />
                    </Button>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-hidden">
                {isProcessing && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 text-white flex-col gap-2">
                        <Loader2 className="animate-spin w-8 h-8" />
                        <span>İşleniyor...</span>
                    </div>
                )}

                {mode === 'crop' && (
                    <div className="absolute inset-0">
                        <Cropper
                            image={currentImage}
                            crop={crop}
                            zoom={zoom}
                            aspect={1} // or undefined for free form
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            showGrid={true}
                        />
                    </div>
                )}

                {(mode === 'draw' || mode === 'lasso') && (
                    <div className="w-full h-full flex items-center justify-center p-4">
                        <canvas
                            ref={canvasRef}
                            className="max-w-full max-h-full cursor-crosshair touch-none shadow-lg bg-transparent"
                            onMouseDown={(e) => { startNewPath(); startDrawing(e) }}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={(e) => { startNewPath(); startDrawing(e) }}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="px-4 pb-4 pt-2 bg-white border-t space-y-4 z-10 flex-shrink-0">
                {mode === 'crop' && (
                    <div className="flex items-center gap-4">
                        <ZoomIn size={16} className="text-gray-500 shrink-0" />
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(val) => setZoom(val[0])}
                            className="flex-1"
                        />
                        <Button size="sm" variant="secondary" onClick={applyCrop} className="shrink-0" disabled={zoom === 1 && crop.x === 0 && crop.y === 0}>
                            Kırpmayı Uygula
                        </Button>
                    </div>
                )}

                {mode === 'lasso' && (
                    <div className="flex justify-center flex-col gap-1 items-center">
                        <p className="text-sm font-medium text-gray-700">Serbest Kesim (Lasso)</p>
                        <p className="text-xs text-gray-500">Saklamak istediğiniz yemeğin etrafını çizin. Çizginin dışı silinecektir.</p>
                    </div>
                )}

                {mode === 'draw' && (
                    <div className="flex items-center gap-6">
                        <div className="flex-1 flex flex-col justify-center gap-2">
                            <span className="text-xs text-gray-500 font-medium">Fırça Kalınlığı</span>
                            <Slider
                                value={[brushSize]}
                                min={5}
                                max={100}
                                step={1}
                                onValueChange={(val) => setBrushSize(val[0])}
                            />
                        </div>
                        <div className="w-px h-8 bg-gray-200" />
                        <div className="flex gap-2 items-center">
                            {['#000000', '#ffffff', '#ef4444', '#3b82f6'].map(color => (
                                <button
                                    key={color}
                                    className={`w-8 h-8 rounded-full border-2 ${brushColor === color ? 'border-blue-500 scale-110' : 'border-gray-200'}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setBrushColor(color)}
                                    title="Renk Seç"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Description input inside Editor */}
                <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">📝 Açıklama / İpucu (opsiyonel)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ör: Beyaz katman krema, üst kısım kakao, altta yulaf var..."
                        className="w-full h-12 px-3 py-2 text-sm rounded-md border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none placeholder:text-gray-400"
                    />
                </div>

                {patientDietType && (
                    <div className="flex items-start gap-2 bg-indigo-50/50 p-2.5 rounded-md border border-indigo-100">
                        <input
                            type="checkbox"
                            checked={applyDietContext}
                            onChange={(e) => setApplyDietContext(e.target.checked)}
                            className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-indigo-900 cursor-pointer" onClick={() => setApplyDietContext(!applyDietContext)}>
                                Bu öğünü {patientDietType} kurallara uygun hazırladım
                            </label>
                            <p className="text-[10px] text-indigo-700 leading-tight">
                                Yapay zeka tabağınızdaki içeriği diyetinize uygun alternatifler olarak değerlendirecektir. Normal bir öğün yediyseniz boş bırakın.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-2 border-t gap-2">
                    <Button variant="outline" onClick={onCancel}>İptal</Button>
                    <Button onClick={handleConfirm} className="gap-2" disabled={isProcessing}>
                        <Check size={16} /> Onayla ve Analiz Et
                    </Button>
                </div>
            </div>
        </div>
    )
} 
