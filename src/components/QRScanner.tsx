import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import { X, Camera as CameraIcon, CheckCircle2, ScanLine, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const handleSuccess = useCallback((data: string) => {
    setIsScanning(false);
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => {
       onScan(data);
    }, 500); 
  }, [onScan]);

  const capture = useCallback(() => {
    if (!isScanning) return;
    
    if (!webcamRef.current || !webcamRef.current.video) {
        requestAnimationFrame(capture);
        return;
    }

    const video = webcamRef.current.video;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        try {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });
            
            if (code && code.data) {
                handleSuccess(code.data);
                return;
            }
        } catch (err) {
            // ignore malformed frame
        }
      }
    }
    
    requestAnimationFrame(capture);
  }, [isScanning, handleSuccess]);

  useEffect(() => {
      // Only start webcam scanning if permission granted and no image processing is blocking
      if (hasCameraPermission === true && isScanning && !isProcessingImage) {
          const rafId = requestAnimationFrame(capture);
          return () => cancelAnimationFrame(rafId);
      }
  }, [hasCameraPermission, isScanning, capture, isProcessingImage]);

  useEffect(() => {
     if (navigator.permissions && navigator.permissions.query) {
         navigator.permissions.query({ name: 'camera' as any }).then(res => {
             if (res.state === 'denied') {
                 setHasCameraPermission(false);
             }
         }).catch(() => {}); // Some browsers don't support modern query
     }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsProcessingImage(true);
      setErrorMsg(null);
      
      const reader = new FileReader();
      reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              // Scale down image if it's too large to prevent memory issues and slow decoding
              const MAX_WIDTH = 1000;
              let width = img.width;
              let height = img.height;
              
              if (width > MAX_WIDTH) {
                  height = Math.round((height * MAX_WIDTH) / width);
                  width = MAX_WIDTH;
              }

              canvas.width = width;
              canvas.height = height;
              
              if (ctx) {
                  ctx.drawImage(img, 0, 0, width, height);
                  const imageData = ctx.getImageData(0, 0, width, height);
                  const code = jsQR(imageData.data, imageData.width, imageData.height, {
                      inversionAttempts: "attemptBoth", // Deep scan for static images
                  });

                  if (code && code.data) {
                      handleSuccess(code.data);
                  } else {
                      setErrorMsg("No QR code found in this image. Please try another one.");
                      setIsProcessingImage(false);
                      // Resume normal scanning mode
                  }
              }
          };
          img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const portalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 px-4 pb-4">
        {/* Deep blur backdrop for premium feel */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-[320px] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20 mx-auto flex flex-col"
        >
          {/* Elegant header */}
          <div className="flex justify-between items-center px-6 py-5">
              <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <ScanLine size={16} className="text-primary" />
                  </div>
                  <span className="font-bold text-base tracking-tight text-gray-900 dark:text-white">Scanner</span>
              </div>
              <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 hover:text-danger hover:bg-red-50 dark:hover:bg-red-500/20 transition-all"
              >
                  <X size={16} />
              </button>
          </div>

          {/* Camera Region - Squared, ultra modern */}
          <div className="relative w-full aspect-square bg-black overflow-hidden shadow-inner">
              {hasCameraPermission === false && !isProcessingImage ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-900">
                      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                          <CameraIcon size={24} className="text-red-500" />
                      </div>
                      <h3 className="text-white text-base font-bold mb-2">Camera Blocked</h3>
                      <p className="text-gray-400 text-xs mb-6 px-4">Allow camera access to scan physical codes.</p>
                      <button onClick={onClose} className="btn bg-white text-black font-bold py-2 px-6 rounded-full text-sm">
                          Close
                      </button>
                  </div>
              ) : (
                  <>
                      {/* Webcam feed */}
                      {!isProcessingImage && (
                          <Webcam
                              ref={webcamRef}
                              audio={false}
                              screenshotFormat="image/jpeg"
                              videoConstraints={{ facingMode: "environment" }}
                              onUserMedia={() => setHasCameraPermission(true)}
                              onUserMediaError={() => setHasCameraPermission(false)}
                              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                              style={{ opacity: isScanning ? 1 : 0.5 }}
                          />
                      )}
                      
                      {/* Image processing placeholder */}
                      {isProcessingImage && (
                          <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                              <div className="animate-pulse flex flex-col items-center">
                                  <ScanLine size={32} className="text-primary mb-3 mx-auto" />
                                  <span className="text-white text-sm font-medium">Scanning Image...</span>
                              </div>
                          </div>
                      )}
                      
                      {/* Ultra-sleek Targeting Reticle */}
                      {hasCameraPermission === true && !isProcessingImage && (
                          <div className="absolute inset-0 z-10 pointer-events-none">
                              {/* Dark frame */}
                              <div className="absolute inset-x-0 top-0 h-[15%] bg-black/40 backdrop-blur-[1px]" />
                              <div className="absolute inset-x-0 bottom-0 h-[15%] bg-black/40 backdrop-blur-[1px]" />
                              <div className="absolute top-[15%] bottom-[15%] left-0 w-[15%] bg-black/40 backdrop-blur-[1px]" />
                              <div className="absolute top-[15%] bottom-[15%] right-0 w-[15%] bg-black/40 backdrop-blur-[1px]" />

                              {/* Center cutout */}
                              <div className="absolute top-[15%] bottom-[15%] left-[15%] right-[15%] rounded-2xl border border-white/30 shadow-[0_0_0_9999px_rgba(0,0,0,0.2)] overflow-hidden">
                                  {isScanning ? (
                                      <motion.div 
                                          animate={{ y: ['0%', '300%', '0%'] }}
                                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                          className="absolute left-0 right-0 h-[2px] bg-primary shadow-[0_0_20px_3px_rgba(var(--primary-rgb),0.8)] z-20" 
                                      />
                                  ) : (
                                      <div className="absolute inset-0 bg-success/40 flex items-center justify-center backdrop-blur-sm">
                                          <motion.div
                                              initial={{ scale: 0, opacity: 0 }}
                                              animate={{ scale: 1, opacity: 1 }}
                                              transition={{ type: "spring", damping: 12 }}
                                              className="bg-white text-success p-4 rounded-full shadow-2xl"
                                          >
                                              <CheckCircle2 size={40} />
                                          </motion.div>
                                      </div>
                                  )}

                                  {/* Corner decorations (iOS style) */}
                                  <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-white rounded-tl-xl m-[-1px]"></div>
                                  <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-white rounded-tr-xl m-[-1px]"></div>
                                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-white rounded-bl-xl m-[-1px]"></div>
                                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-white rounded-br-xl m-[-1px]"></div>
                              </div>
                          </div>
                      )}
                  </>
              )}
          </div>

          {errorMsg && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs py-2 px-4 text-center font-medium border-y border-red-100 dark:border-red-900/50">
                 {errorMsg}
              </div>
          )}

          {/* Bottom Actions Area */}
          <div className="p-5 bg-white dark:bg-zinc-900">
              <p className={`text-center font-medium text-xs mb-4 transition-colors duration-300 ${isScanning ? 'text-gray-500' : 'text-success font-bold text-sm'}`}>
                  {isScanning 
                      ? "Align QR code within frame" 
                      : "Captured Successfully!"}
              </p>
              
              <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
              />
              
              <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-2xl transition-all group"
              >
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ImageIcon size={14} className="text-primary" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Upload from Gallery</span>
              </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(portalContent, document.body);
};
