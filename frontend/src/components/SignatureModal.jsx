import React, { useRef, useState, useEffect } from 'react';
import { X, Trash2, Check, PenTool } from 'lucide-react';

const SignatureModal = ({ isOpen, onClose, onSave, isSaving }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Short delay to ensure canvas is rendered before setting size
      setTimeout(resizeCanvas, 100);
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Set drawing style
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1e293b'; // Slate 800
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e) => {
      if (e.cancelable) e.preventDefault();
      startDrawing(e);
    };

    const handleTouchMove = (e) => {
      if (e.cancelable) e.preventDefault();
      draw(e);
    };

    const handleTouchEnd = (e) => {
      stopDrawing();
    };

    // Add listeners with passive: false to allow preventDefault
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, isDrawing]); // Add dependencies to ensure listeners are updated

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    // Only call preventDefault if it's a mouse event (touch handled in useEffect)
    if (!e.touches && e.preventDefault) e.preventDefault();
    
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    // Only call preventDefault if it's a mouse event (touch handled in useEffect)
    if (!e.touches && e.preventDefault) e.preventDefault();
    
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (isEmpty) return;
    const canvas = canvasRef.current;
    
    // Create a temporary canvas to add white background or keep it transparent
    // Let's keep it transparent but crop empty space if we wanted to be fancy.
    // For now, just send the data URL.
    canvas.toBlob((blob) => {
      const file = new File([blob], "signature.png", { type: "image/png" });
      onSave(file);
    }, 'image/png');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm transition-all animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <PenTool size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 tracking-tight">เซ็นชื่อกำกับ</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Signature Pad</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="p-6">
          <div className="relative aspect-[2/1] bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden shadow-inner cursor-crosshair">
            <canvas
              ref={canvasRef}
              className="w-full h-full touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            {isEmpty && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-300">
                <PenTool size={48} className="mb-2 opacity-20" />
                <p className="text-sm font-bold opacity-40 uppercase tracking-widest">เริ่มเซ็นชื่อที่นี่</p>
              </div>
            )}
          </div>
          <p className="mt-4 text-[10px] text-slate-400 font-bold text-center italic">
            * กรุณาเซ็นชื่อภายในกรอบสี่เหลี่ยมด้านบน
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <button
            onClick={clear}
            className="flex-1 py-3 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={16} /> ล้างหน้าจอ
          </button>
          <button
            onClick={handleSave}
            disabled={isEmpty || isSaving}
            className="flex-[2] py-3 px-6 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 disabled:bg-slate-300 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Check size={18} />
            )}
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกรายเซ็น'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;
