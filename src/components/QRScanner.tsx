import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import { X, Camera as CameraIcon, CheckCircle2, ScanLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const webcamRef = useRef<Webcam>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

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
                setIsScanning(false);
                if (navigator.vibrate) navigator.vibrate(50);
                setTimeout(() => {
                   onScan(code.data);
                }, 400); 
                return;
            }
        } catch (err) {
            // ignore malformed frame
        }
      }
    }
    
    requestAnimationFrame(capture);
  }, [isScanning, onScan]);

  useEffect(() => {
      if (hasCameraPermission === true && isScanning) {
          const rafId = requestAnimationFrame(capture);
          return () => cancelAnimationFrame(rafId);
      }
  }, [hasCameraPermission, isScanning, capture]);

  useEffect(() => {
     if (navigator.permissions && navigator.permissions.query) {
         navigator.permissions.query({ name: 'camera' as any }).then(res => {
             if (res.state === 'denied') {
                 setHasCameraPermission(false);
                 setErrorMsg("Camera permission denied. Please allow it in your browser settings.");
             }
         }).catch(() => {});
     }
  }, []);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden border border-black/5 dark:border-white/5 mx-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2 text-primary font-bold">
                  <ScanLine size={20} />
                  <span className="tracking-tight text-black dark:text-white">Smart Scanner</span>
              </div>
              <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-danger hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                  <X size={18} />
              </button>
          </div>

          {/* Camera Region */}
          <div className="relative aspect-square w-full bg-black flex flex-col items-center justify-center overflow-hidden">
              {hasCameraPermission === false || errorMsg ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                          <CameraIcon size={28} className="text-red-500" />
                      </div>
                      <h3 className="text-white text-lg font-bold mb-2">Camera Blocked</h3>
                      <p className="text-gray-400 text-sm mb-6 px-4">{errorMsg || "Please grant camera permissions to scan."}</p>
                      <button onClick={onClose} className="btn bg-white text-black font-bold py-2 px-6 rounded-full w-[80%]">
                          Go Back
                      </button>
                  </div>
              ) : (
                  <>
                      {/* Webcam feed */}
                      <Webcam
                          ref={webcamRef}
                          audio={false}
                          screenshotFormat="image/jpeg"
                          videoConstraints={{ facingMode: "environment" }}
                          onUserMedia={() => setHasCameraPermission(true)}
                          onUserMediaError={(err: any) => {
                              setHasCameraPermission(false);
                              setErrorMsg("Camera error: " + (err.message || "Failed to access hardware"));
                          }}
                          className="absolute inset-0 w-full h-full object-cover"
                      />
                      
                      {/* Reticle / Cutout Overlay */}
                      {hasCameraPermission === true && (
                          <div className="absolute inset-0 z-10 pointer-events-none">
                              {/* Left / Right / Top / Bottom dark bars to create a cutout look (optional, but CSS borders is easier) */}
                              <div className="absolute inset-x-0 top-0 h-[10%] bg-black/60 backdrop-blur-[2px]" />
                              <div className="absolute inset-x-0 bottom-0 h-[10%] bg-black/60 backdrop-blur-[2px]" />
                              <div className="absolute top-[10%] bottom-[10%] left-0 w-[10%] bg-black/60 backdrop-blur-[2px]" />
                              <div className="absolute top-[10%] bottom-[10%] right-0 w-[10%] bg-black/60 backdrop-blur-[2px]" />

                              {/* The Scanner Box Frame */}
                              <div className="absolute top-[10%] bottom-[10%] left-[10%] right-[10%] border-2 border-white/20">
                                  {isScanning ? (
                                      <motion.div 
                                          animate={{ y: ['0%', '280%', '0%'] }}
                                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                          className="absolute left-0 right-0 h-[2px] bg-primary/90 shadow-[0_0_12px_rgba(var(--primary-rgb),1)] z-20" 
                                      />
                                  ) : (
                                      <div className="absolute inset-0 bg-success/30 flex items-center justify-center backdrop-blur-[1px]">
                                          <motion.div
                                              initial={{ scale: 0.5, opacity: 0 }}
                                              animate={{ scale: 1, opacity: 1 }}
                                              className="bg-white text-success p-3 rounded-full shadow-lg"
                                          >
                                              <CheckCircle2 size={40} />
                                          </motion.div>
                                      </div>
                                  )}

                                  {/* Corner decorations */}
                                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl" style={{ marginTop: '-2px', marginLeft: '-2px' }}></div>
                                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr" style={{ marginTop: '-2px', marginRight: '-2px' }}></div>
                                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl" style={{ marginBottom: '-2px', marginLeft: '-2px' }}></div>
                                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br" style={{ marginBottom: '-2px', marginRight: '-2px' }}></div>
                              </div>
                          </div>
                      )}
                  </>
              )}
          </div>

          <div className="p-5 text-center bg-gray-50 dark:bg-zinc-800/50">
              <p className={`font-medium text-sm transition-colors duration-300 ${isScanning ? 'text-gray-500 hover:text-gray-800' : 'text-success font-bold text-base'}`}>
                  {isScanning 
                      ? "Center QR code or barcode inside the frame to scan automatically." 
                      : "Successfully Captured!"}
              </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
