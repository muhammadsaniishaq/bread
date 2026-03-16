import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { Check, X } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBase64: string) => void;
  onCancel: () => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); 
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Set standard passport/ID card resolution
  const TARGET_WIDTH = 300;
  const TARGET_HEIGHT = 300;
  
  canvas.width = TARGET_WIDTH;
  canvas.height = TARGET_HEIGHT;

  // Fill background
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    TARGET_WIDTH,
    TARGET_HEIGHT
  );

  return canvas.toDataURL('image/jpeg', 0.9);
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
      alert('Failed to crop image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col h-[100dvh]">
      
      {/* Header */}
      <div className="text-white text-center py-4 shrink-0 px-4 flex justify-between items-center relative z-10">
        <div className="w-8"></div> {/* Spacer for centering */}
        <div>
          <h3 className="font-bold text-lg">Crop Photo</h3>
          <p className="text-secondary text-xs mt-0.5">Pinch inside box to zoom</p>
        </div>
        <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white">
          <X size={18} />
        </button>
      </div>

      {/* Cropper Area - dynamically takes available height */}
      <div className="flex-1 w-full relative flex items-center justify-center p-4 min-h-0">
        <div className="relative w-full max-w-[300px] max-h-full aspect-square bg-gray-900 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] border-2 border-primary/50 shrink-0">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
            showGrid={true}
            cropShape="rect"
            /* Apply custom styling for internal container to fix bounds */
            classes={{
              containerClassName: 'h-full w-full'
            }}
          />
        </div>
      </div>
      
      {/* Footer Controls - Fixed height at bottom */}
      <div className="w-full bg-[#1e293b] p-5 pb-safe pt-4 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10 shrink-0 relative z-20 mt-auto">
        <div className="mb-5 flex items-center gap-4 max-w-sm mx-auto">
           <span className="text-white text-[10px] font-bold uppercase tracking-wider shrink-0">Zoom</span>
           
           <input
             type="range"
             value={zoom}
             min={1}
             max={3}
             step={0.1}
             onChange={(e) => setZoom(Number(e.target.value))}
             className="w-full h-2 rounded-lg appearance-none cursor-pointer"
             style={{ 
               background: `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${((zoom - 1) / 2) * 100}%, #475569 ${((zoom - 1) / 2) * 100}%, #475569 100%)` 
             }}
           />
           <style>{`
             input[type=range]::-webkit-slider-thumb {
               -webkit-appearance: none;
               height: 24px;
               width: 24px;
               border-radius: 50%;
               background: white;
               box-shadow: 0 2px 6px rgba(0,0,0,0.3);
               cursor: pointer;
               margin-top: -11px;
             }
             input[type=range]::-webkit-slider-runnable-track {
               width: 100%;
               height: 4px;
               cursor: pointer;
               background: transparent;
               border-radius: 2px;
             }
             /* Fallback safe area padding for iOS */
             .pb-safe { padding-bottom: max(1.25rem, env(safe-area-inset-bottom)); }
           `}</style>
        </div>
        
        <div className="max-w-sm mx-auto">
          <button 
            type="button" 
            className="w-full py-4 px-4 bg-primary text-white rounded-xl font-bold shadow-[0_4px_14px_0_rgba(var(--primary-rgb),0.39)] flex items-center justify-center gap-2 transition-transform active:scale-95 text-[15px]"
            onClick={handleSave}
            disabled={isProcessing}
          >
            {isProcessing ? 'Saving...' : (
              <><Check size={20} /> Crop & Save Photo</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
