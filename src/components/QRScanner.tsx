import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import { X, Camera as CameraIcon, CheckCircle2 } from 'lucide-react';
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
    
    // Safety check - sometimes ref isn't ready
    if (!webcamRef.current || !webcamRef.current.video) {
        requestAnimationFrame(capture);
        return;
    }

    const video = webcamRef.current.video;
    
    // Ensure video is playing and has dimensions
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        try {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });
            
            if (code && code.data) {
                setIsScanning(false);
                // Play a subtle success sound or vibrate
                if (navigator.vibrate) navigator.vibrate(50);
                setTimeout(() => {
                   onScan(code.data);
                }, 400); // Give the user half a second to see the scan succeeded visually
                return; // Stop the loop
            }
        } catch (err) {
            // jsqr can sometimes throw on malformed images, we just ignore and keep scanning
        }
      }
    }
    
    // Loop
    requestAnimationFrame(capture);
  }, [isScanning, onScan]);

  useEffect(() => {
      if (hasCameraPermission === true && isScanning) {
          // Start the scanning loop once permission is granted
          const rafId = requestAnimationFrame(capture);
          return () => cancelAnimationFrame(rafId);
      }
  }, [hasCameraPermission, isScanning, capture]);

  // Check initial permissions if possible, otherwise rely on the Webcam component's onUserMedia callback
  useEffect(() => {
     if (navigator.permissions && navigator.permissions.query) {
         navigator.permissions.query({ name: 'camera' as any }).then(res => {
             if (res.state === 'denied') {
                 setHasCameraPermission(false);
                 setErrorMsg("Camera permission is completely denied in your browser settings. Please allow access to scan IDs.");
             }
         }).catch(() => { /* ignore, some browsers don't support this */ });
     }
  }, []);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col bg-black overflow-hidden"
      >
        {/* Header Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 pt-safe-top bg-gradient-to-b from-black/80 to-transparent">
            <h2 className="text-white font-bold tracking-wide text-lg">Scan Barcode / QR</h2>
            <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
                <X size={24} />
            </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="relative flex-1 flex flex-col items-center justify-center h-full w-full">
            {hasCameraPermission === false || errorMsg ? (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-black/50 backdrop-blur-md rounded-2xl border border-white/10" style={{ maxWidth: '400px' }}>
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                        <CameraIcon size={32} className="text-red-400" />
                    </div>
                    <h3 className="text-white text-xl font-bold mb-3">Camera Blocked</h3>
                    <p className="text-gray-400 mb-8">{errorMsg || "Please grant camera permissions to use the scanner."}</p>
                    <button onClick={onClose} className="btn w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">
                        Go Back
                    </button>
                </div>
            ) : (
                <>
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
                        className="absolute inset-0 w-[100vw] h-full object-cover z-0"
                    />
                    
                    {/* Modern Overlay / Reticle */}
                    {hasCameraPermission === true && (
                        <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
                            {/* Darken surrounding area */}
                            <div className="flex-1 bg-black/60 backdrop-blur-[2px]" />
                            <div className="flex w-full" style={{ height: '300px' }}>
                                <div className="flex-1 bg-black/60 backdrop-blur-[2px]" />
                                <div className="w-[300px] relative border-2 border-white/20 flex items-center justify-center overflow-hidden">
                                    {/* Animated scan line */}
                                    {isScanning ? (
                                        <motion.div 
                                            animate={{ y: [0, 296, 0] }}
                                            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                            className="absolute top-0 left-0 right-0 h-1 bg-primary/90 shadow-[0_0_15px_rgba(var(--primary-rgb),1)] z-20" 
                                        />
                                    ) : (
                                        <motion.div
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="bg-primary text-white p-4 rounded-full shadow-[0_0_30px_rgba(var(--primary-rgb),0.8)] z-30"
                                        >
                                            <CheckCircle2 size={48} />
                                        </motion.div>
                                    )}

                                    {/* Viewfinder Corners */}
                                    <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-lg" style={{ marginTop: '-2px', marginLeft: '-2px' }}></div>
                                    <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-lg" style={{ marginTop: '-2px', marginRight: '-2px' }}></div>
                                    <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-lg" style={{ marginBottom: '-2px', marginLeft: '-2px' }}></div>
                                    <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-lg" style={{ marginBottom: '-2px', marginRight: '-2px' }}></div>
                                </div>
                                <div className="flex-1 bg-black/60 backdrop-blur-[2px]" />
                            </div>
                            <div className="flex-1 bg-black/60 backdrop-blur-[2px] flex items-center justify-center pb-20">
                                <motion.div 
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-black/40 px-6 py-3 rounded-full backdrop-blur-md border border-white/10"
                                >
                                    <p className={`text-white/90 text-sm font-bold tracking-wide ${isScanning ? 'animate-pulse' : 'text-success'}`}>
                                        {isScanning ? "Position barcode within frame" : "Scan Complete!"}
                                    </p>
                                </motion.div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
