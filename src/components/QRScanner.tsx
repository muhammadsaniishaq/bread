import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import { X, Camera as CameraIcon, CheckCircle2, ScanLine, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

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
      <div 
        style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            height: '100vh', width: '100vw', zIndex: 9999, 
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', 
            paddingTop: '12vh', paddingLeft: '1rem', paddingRight: '1rem',
            pointerEvents: 'none'
        }}
      >
        {/* Deep blur backdrop for premium feel */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', pointerEvents: 'auto' }}
            onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          style={{ 
              pointerEvents: 'auto',
              position: 'relative',
              width: '100%',
              maxWidth: '260px',
              backgroundColor: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(24px)',
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.08)',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 10
          }}
        >
          {/* Elegant header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', backgroundColor: 'rgba(255,255,255,0.8)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ScanLine size={16} color="#4f46e5" />
                  </div>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#111827' }}>Smart Scanner</span>
              </div>
              <button 
                  onClick={onClose}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
              >
                  <X size={16} color="#6b7280" />
              </button>
          </div>

          {/* Camera Region - Squared, ultra modern */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', backgroundColor: '#000', overflow: 'hidden' }}>
              {hasCameraPermission === false && !isProcessingImage ? (
                  <div style={{ position: 'absolute', top:0, left:0, right:0, bottom:0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', backgroundColor: '#18181b' }}>
                      <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                          <CameraIcon size={24} color="#ef4444" />
                      </div>
                      <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Camera Blocked</h3>
                      <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 24px 0', padding: '0 16px' }}>Allow camera access to scan codes.</p>
                      <button onClick={onClose} style={{ backgroundColor: '#fff', color: '#000', fontWeight: 'bold', padding: '8px 24px', borderRadius: '9999px', fontSize: '14px', border: 'none', cursor: 'pointer' }}>
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
                              style={{ position: 'absolute', top:0, left:0, right:0, bottom:0, width: '100%', height: '100%', objectFit: 'cover', opacity: isScanning ? 1 : 0.5, transition: 'opacity 0.5s' }}
                          />
                      )}
                      
                      {/* Image processing placeholder */}
                      {isProcessingImage && (
                          <div style={{ position: 'absolute', top:0, left:0, right:0, bottom:0, backgroundColor: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <ScanLine size={32} color="#4f46e5" style={{ marginBottom: '12px' }} />
                                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>Scanning Image...</span>
                              </div>
                          </div>
                      )}
                      
                      {/* Ultra-sleek Targeting Reticle */}
                      {hasCameraPermission === true && !isProcessingImage && (
                          <div style={{ position: 'absolute', top:0, left:0, right:0, bottom:0, zIndex: 10, pointerEvents: 'none' }}>
                               {/* Dark frame */}
                              <div style={{ position: 'absolute', left:0, right:0, top: 0, height: '15%', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} />
                              <div style={{ position: 'absolute', left:0, right:0, bottom: 0, height: '15%', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} />
                              <div style={{ position: 'absolute', top: '15%', bottom: '15%', left: 0, width: '15%', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} />
                              <div style={{ position: 'absolute', top: '15%', bottom: '15%', right: 0, width: '15%', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} />

                              {/* Center cutout */}
                              <div style={{ position: 'absolute', top: '15%', bottom: '15%', left: '15%', right: '15%', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 0 0 9999px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                  {isScanning ? (
                                      <motion.div 
                                          animate={{ y: ['0%', '300%', '0%'] }}
                                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                          style={{ position: 'absolute', left: 0, right: 0, height: '2px', backgroundColor: '#4f46e5', boxShadow: '0 0 20px 3px rgba(79, 70, 229, 0.8)', zIndex: 20 }}
                                      />
                                  ) : (
                                      <div style={{ position: 'absolute', top:0, left:0, right:0, bottom:0, backgroundColor: 'rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
                                          <motion.div
                                              initial={{ scale: 0, opacity: 0 }}
                                              animate={{ scale: 1, opacity: 1 }}
                                              transition={{ type: "spring", damping: 12 }}
                                              style={{ backgroundColor: '#fff', color: '#10b981', padding: '16px', borderRadius: '50%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                                          >
                                              <CheckCircle2 size={40} />
                                          </motion.div>
                                      </div>
                                  )}

                                  {/* Corner decorations (iOS style) */}
                                  <div style={{ position: 'absolute', top: 0, left: 0, width: '32px', height: '32px', borderTop: '3px solid white', borderLeft: '3px solid white', borderTopLeftRadius: '12px', margin: '-1px' }}></div>
                                  <div style={{ position: 'absolute', top: 0, right: 0, width: '32px', height: '32px', borderTop: '3px solid white', borderRight: '3px solid white', borderTopRightRadius: '12px', margin: '-1px' }}></div>
                                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '32px', height: '32px', borderBottom: '3px solid white', borderLeft: '3px solid white', borderBottomLeftRadius: '12px', margin: '-1px' }}></div>
                                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '32px', height: '32px', borderBottom: '3px solid white', borderRight: '3px solid white', borderBottomRightRadius: '12px', margin: '-1px' }}></div>
                              </div>
                          </div>
                      )}
                  </>
              )}
          </div>

          {errorMsg && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '12px', padding: '12px 16px', textAlign: 'center', fontWeight: 500, borderTop: '1px solid rgba(239, 68, 68, 0.2)', borderBottom: '1px solid rgba(239, 68, 68, 0.2)' }}>
                 {errorMsg}
              </div>
          )}

          {/* Bottom Actions Area */}
          <div style={{ padding: '20px', backgroundColor: '#fff', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <p style={{ textAlign: 'center', fontWeight: 600, fontSize: '12px', margin: '0 0 16px 0', color: isScanning ? '#6b7280' : '#10b981', transition: 'color 0.3s' }}>
                  {isScanning 
                      ? "Align code within frame" 
                      : "Captured Successfully!"}
              </p>
              
              <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
              />
              
              <button 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#f9fafb', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
              >
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={14} color="#4f46e5" />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>Upload Gallery Image</span>
              </button>
          </div>
        </motion.div>
      </div>
  );

  return createPortal(portalContent, document.body);
};
