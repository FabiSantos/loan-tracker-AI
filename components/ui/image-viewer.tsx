"use client"

import { useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

interface ImageViewerProps {
  images: { url: string; id: string }[]
  initialIndex?: number
}

export function ImageViewer({ images, initialIndex = 0 }: ImageViewerProps) {
  const [open, setOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div key={image.id} className="relative group">
            <img
              src={image.url}
              alt={`Foto ${index + 1}`}
              className="aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => {
                setCurrentIndex(index)
                setOpen(true)
              }}
            />
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="relative">
            {/* Imagen */}
            <img
              src={images[currentIndex]?.url}
              alt={`Foto ${currentIndex + 1}`}
              className="w-full h-full max-h-[80vh] object-contain"
            />

            {/* Controles */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Indicador */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                  {currentIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}