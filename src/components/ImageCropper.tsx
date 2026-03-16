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
  const TARGET_WIDTH = 600;
  const TARGET_HEIGHT = 600;
  
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

  return canvas.toDataURL('image/jpeg', 1.0);
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
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '-webkit-fill-available'
      }}
    >
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', flexShrink: 0, position: 'relative', zIndex: 10 }}>
        <div style={{ width: '32px' }}></div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '18px', color: '#fff', margin: 0 }}>Crop Photo</h3>
          <p style={{ color: '#aaa', fontSize: '12px', margin: '4px 0 0 0' }}>Pinch inside box to zoom</p>
        </div>
        <button 
          onClick={onCancel} 
          style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Cropper Area */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', minHeight: 0 }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '300px', aspectRatio: '1/1', backgroundColor: '#111', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 0 40px rgba(0,0,0,0.5)', border: '2px solid var(--primary-color)', flexShrink: 0 }}>
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
            classes={{ containerClassName: 'cropper-container-internal' }}
          />
          <style>{`.cropper-container-internal { height: 100% !important; width: 100% !important; }`}</style>
        </div>
      </div>
      
      {/* Footer Controls */}
      <div style={{ width: '100%', backgroundColor: '#1e293b', padding: '20px 20px max(20px, env(safe-area-inset-bottom)) 20px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, position: 'relative', zIndex: 20 }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px', maxWidth: '384px', margin: '0 auto 20px auto' }}>
           <span style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Zoom</span>
           
           <input
             type="range"
             value={zoom}
             min={1}
             max={3}
             step={0.1}
             onChange={(e) => setZoom(Number(e.target.value))}
             style={{ 
               width: '100%', height: '8px', borderRadius: '8px', WebkitAppearance: 'none', cursor: 'pointer',
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
               margin-top: -8px;
             }
             input[type=range]::-webkit-slider-runnable-track {
               width: 100%;
               height: 8px;
               cursor: pointer;
               background: transparent;
               border-radius: 4px;
             }
           `}</style>
        </div>
        
        <div style={{ maxWidth: '384px', margin: '0 auto' }}>
          <button 
            type="button" 
            onClick={handleSave}
            disabled={isProcessing}
            style={{ width: '100%', padding: '16px', backgroundColor: 'var(--primary-color)', color: '#fff', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 14px 0 rgba(var(--primary-rgb), 0.39)', transition: 'transform 0.1s' }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.96)'}
            onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
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
