import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface CropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropCompleteAction: (base64: string) => void;
  shape?: 'rect' | 'round';
  title?: string;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('No 2d context');

  canvas.width = 400; // Output width
  canvas.height = 400; // Output height (square)

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    400,
    400
  );

  return canvas.toDataURL('image/jpeg', 0.9);
};

export const ImageCropModal: React.FC<CropModalProps> = ({ 
  isOpen, 
  imageSrc, 
  onClose, 
  onCropCompleteAction,
  shape = 'rect',
  title = 'Crop Image'
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropCompleteAction(croppedImage);
    } catch (e) {
      console.error(e);
    }
    setProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          style={{ width: '90%', maxWidth: '400px', background: '#1e293b', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '500px' }}>
          
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
             <h3 style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: 900 }}>{title}</h3>
             <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '12px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
          </div>

          <div style={{ position: 'relative', flex: 1, background: '#0f172a' }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape={shape}
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>

          <div style={{ padding: '20px', background: '#1e293b' }}>
             <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))}
               style={{ width: '100%', marginBottom: '20px', accentColor: '#4f46e5' }} />
             
             <button onClick={handleSave} disabled={processing}
               style={{ width: '100%', padding: '14px', borderRadius: '14px', background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
               {processing ? 'Processing...' : <><Check size={16} /> Save Image</>}
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
