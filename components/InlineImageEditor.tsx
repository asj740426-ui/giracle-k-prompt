import React, { useState, useRef, useEffect, useCallback } from 'react';
import { t, Language } from '../localization/i18n';
import { LEGWEAR_PICKER_COLORS, COLOR_NAME_TO_HEX_MAP } from '../constants';
import { segmentObjectFromScribble } from '../utils';

interface ImagePart {
    base64: string;
    mimeType: string;
    prompt?: string;
}

interface InlineImageEditorProps {
  image: ImagePart;
  onApply: (sourceImage: ImagePart, maskImage: ImagePart, color: string) => Promise<void>;
  onCancel: () => void;
  isProcessing: boolean;
  language: Language;
  addLog: (message: string) => void;
}

type Tool = 'brush' | 'eraser' | 'smart';

const MASK_COLOR = 'rgba(128, 128, 128, 0.7)';
const SMART_MASK_COLOR = 'rgba(59, 130, 246, 0.7)';


const InlineImageEditor: React.FC<InlineImageEditorProps> = ({ image, onApply, onCancel, isProcessing, language, addLog }) => {
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  
  const [tool, setTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState(20);
  const [selectedColor, setSelectedColor] = useState('red');
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const [isSegmenting, setIsSegmenting] = useState(false);
  
  const interactionRef = useRef({
      mode: 'none' as 'none' | 'drawing' | 'panning',
      panStart: { x: 0, y: 0 },
      lastPos: null as { x: number; y: number } | null,
  });

  useEffect(() => {
    if (!image) {
      setLoadedImage(null);
      return;
    }
    const imageEl = new Image();
    imageEl.onload = () => setLoadedImage(imageEl);
    imageEl.onerror = () => setLoadedImage(null);
    imageEl.src = `data:${image.mimeType};base64,${image.base64}`;
  }, [image]);
  
  const resetZoomAndPan = useCallback(() => {
    const container = containerRef.current;
    const canvas = imageCanvasRef.current;
    if (container && canvas && canvas.width > 0) {
        const containerRect = container.getBoundingClientRect();
        
        // Default to 100% zoom (actual pixels) to provide a more detailed editing view.
        // The user can zoom out if they need to see the whole image.
        const scale = 1.0;
        setZoom(scale);

        // Center the image within the container
        const newWidth = canvas.width * scale;
        const newHeight = canvas.height * scale;
        setPan({
            x: (containerRect.width - newWidth) / 2,
            y: (containerRect.height - newHeight) / 2
        });
    } else {
        setPan({ x: 0, y: 0 });
        setZoom(1);
    }
  }, []);

  useEffect(() => {
    const imageCanvas = imageCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!loadedImage || !imageCanvas || !maskCanvas) return;
    
    imageCanvas.width = loadedImage.naturalWidth;
    imageCanvas.height = loadedImage.naturalHeight;
    maskCanvas.width = loadedImage.naturalWidth;
    maskCanvas.height = loadedImage.naturalHeight;
    
    const imageCtx = imageCanvas.getContext('2d');
    imageCtx?.drawImage(loadedImage, 0, 0);

    resetZoomAndPan();
  }, [loadedImage, resetZoomAndPan]);

    const handleZoom = (newZoomLevel: number, pivot: { x: number, y: number }) => {
        const newZoom = Math.max(0.1, Math.min(newZoomLevel, 16));
        const imageX = (pivot.x - pan.x) / zoom;
        const imageY = (pivot.y - pan.y) / zoom;
        const newPanX = pivot.x - imageX * newZoom;
        const newPanY = pivot.y - imageY * newZoom;
        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const containerRect = e.currentTarget.getBoundingClientRect();
        const pivot = { x: e.clientX - containerRect.left, y: e.clientY - containerRect.top };
        const newZoomLevel = zoom - e.deltaY * 0.002 * zoom;
        handleZoom(newZoomLevel, pivot);
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const getTransformedCoords = (clientX: number, clientY: number) => {
            const canvas = maskCanvasRef.current;
            if (!canvas) return { x: 0, y: 0 };

            const rect = canvas.getBoundingClientRect();
            // mouse position relative to the viewport -> relative to the scaled/panned canvas
            const mouseX = clientX - rect.left;
            const mouseY = clientY - rect.top;

            // scale back to the canvas's original resolution
            const canvasX = mouseX / zoom;
            const canvasY = mouseY / zoom;

            return { x: canvasX, y: canvasY };
        };

        const handleInteractionStart = (e: MouseEvent) => {
            e.preventDefault();
            const isPanGesture = e.button === 2 || e.button === 1 || e.metaKey || e.ctrlKey;

            if (isPanGesture) {
                interactionRef.current.mode = 'panning';
                interactionRef.current.panStart = { x: e.clientX - pan.x, y: e.clientY - pan.y };
            } else if (e.button === 0) {
                interactionRef.current.mode = 'drawing';
                const coords = getTransformedCoords(e.clientX, e.clientY);
                const canvas = maskCanvasRef.current;
                const ctx = canvas?.getContext('2d');
                if (!ctx) return;

                const color = tool === 'smart' ? SMART_MASK_COLOR : MASK_COLOR;
                ctx.beginPath();
                ctx.arc(coords.x, coords.y, (brushSize / 2) / zoom, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
                ctx.fill();
                interactionRef.current.lastPos = coords;
            }
        };
        const handleInteractionMove = (e: MouseEvent) => {
            if (interactionRef.current.mode === 'panning') {
                setPan({ x: e.clientX - interactionRef.current.panStart.x, y: e.clientY - interactionRef.current.panStart.y });
            } else if (interactionRef.current.mode === 'drawing') {
                const coords = getTransformedCoords(e.clientX, e.clientY);
                const canvas = maskCanvasRef.current;
                const ctx = canvas?.getContext('2d');
                if (!ctx) return;
                
                const color = tool === 'smart' ? SMART_MASK_COLOR : MASK_COLOR;
                ctx.strokeStyle = color;
                ctx.lineWidth = brushSize / zoom;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
                
                if (interactionRef.current.lastPos) {
                    ctx.beginPath();
                    ctx.moveTo(interactionRef.current.lastPos.x, interactionRef.current.lastPos.y);
                    ctx.lineTo(coords.x, coords.y);
                    ctx.stroke();
                }
                interactionRef.current.lastPos = coords;
            }
        };
        const handleInteractionEnd = () => {
            interactionRef.current.mode = 'none';
            interactionRef.current.lastPos = null;
        };
        const preventContextMenu = (e: MouseEvent) => e.preventDefault();
        
        container.addEventListener('mousedown', handleInteractionStart);
        window.addEventListener('mousemove', handleInteractionMove);
        window.addEventListener('mouseup', handleInteractionEnd);
        container.addEventListener('contextmenu', preventContextMenu);

        return () => {
            container.removeEventListener('mousedown', handleInteractionStart);
            window.removeEventListener('mousemove', handleInteractionMove);
            window.removeEventListener('mouseup', handleInteractionEnd);
            container.removeEventListener('contextmenu', preventContextMenu);
        };
    }, [pan, zoom, tool, brushSize]);

  const createMaskFromCanvas = (): ImagePart | null => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return null;
    const { width, height } = maskCanvas;
    if (width === 0) return null;

    const binaryMaskCanvas = document.createElement('canvas');
    binaryMaskCanvas.width = width;
    binaryMaskCanvas.height = height;
    const binaryCtx = binaryMaskCanvas.getContext('2d');
    if (!binaryCtx) return null;

    const userMaskImageData = maskCanvas.getContext('2d')?.getImageData(0, 0, width, height);
    if (!userMaskImageData) return null;
    
    const binaryImageData = binaryCtx.createImageData(width, height);
    let hasMask = false;
    for (let i = 0; i < userMaskImageData.data.length; i += 4) {
      const isMasked = userMaskImageData.data[i + 3] > 0;
      if (isMasked) hasMask = true;
      binaryImageData.data[i] = isMasked ? 255 : 0;
      binaryImageData.data[i + 1] = isMasked ? 255 : 0;
      binaryImageData.data[i + 2] = isMasked ? 255 : 0;
      binaryImageData.data[i + 3] = 255;
    }

    if (!hasMask) return null;
    binaryCtx.putImageData(binaryImageData, 0, 0);

    const maskBase64 = binaryMaskCanvas.toDataURL('image/png').split(',')[1];
    return { base64: maskBase64, mimeType: 'image/png' };
  }

  const handleApply = async () => {
    if (!image) return;
    
    const userMask = createMaskFromCanvas();
    if (!userMask) {
      addLog("Mask is empty. Please draw on the image first.");
      return;
    }

    if (tool === 'smart') {
      setIsSegmenting(true);
      addLog(t('imageEditModal.smartSelectLog', language));
      try {
        const cleanMask = await segmentObjectFromScribble(image, userMask, language);
        addLog(t('imageEditModal.smartSelectSuccessLog', language));
        await onApply(image, cleanMask, selectedColor);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        addLog(t('imageEditModal.smartSelectErrorLog', language, message));
      } finally {
        setIsSegmenting(false);
      }
    } else {
      await onApply(image, userMask, selectedColor);
    }
  };

  const clearMask = () => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };
  
  const anyProcessing = isProcessing || isSegmenting;

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full w-full border-2 border-fuchsia-500 rounded-lg p-2 bg-black/30">
        <div 
            ref={containerRef} 
            className="relative flex-grow w-full h-full min-h-[250px] flex items-center justify-center bg-black/20 rounded-md overflow-hidden"
            onWheel={handleWheel}
        >
            <div
                style={{
                    position: 'absolute',
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'top left',
                    width: loadedImage?.naturalWidth,
                    height: loadedImage?.naturalHeight,
                }}
            >
                <canvas ref={imageCanvasRef} />
                <canvas 
                    ref={maskCanvasRef} 
                    className="absolute top-0 left-0"
                    style={{ cursor: interactionRef.current.mode === 'panning' ? 'grabbing' : 'crosshair' }}
                />
            </div>
             {anyProcessing && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center text-slate-300 z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-400 mx-auto"></div>
                    <p className="mt-2 text-xs">{isSegmenting ? t('imageEditModal.segmenting', language) : t('imageEditModal.processing', language)}</p>
                </div>
             )}
        </div>

        <div className="flex flex-col justify-between gap-4 md:w-56 flex-shrink-0">
          <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 p-1 bg-slate-800/50 rounded-md text-xs">
                <span className="text-slate-400 px-2">{t('imageEditModal.controlsHelp', language)}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => { const c = containerRef.current?.getBoundingClientRect(); handleZoom(zoom / 1.5, {x: c?.width/2 || 0, y: c?.height/2 || 0})}} className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600">-</button>
                  <button onClick={resetZoomAndPan} className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 w-16 text-center">{(zoom * 100).toFixed(0)}%</button>
                  <button onClick={() => { const c = containerRef.current?.getBoundingClientRect(); handleZoom(zoom * 1.5, {x: c?.width/2 || 0, y: c?.height/2 || 0})}} className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600">+</button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                  {(['smart', 'brush', 'eraser'] as Tool[]).map(tName => (
                      <button key={tName} onClick={() => setTool(tName)} className={`text-xs py-1 rounded-md transition-colors ${tool === tName ? 'bg-fuchsia-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>{t(`imageEditModal.${tName}`, language)}</button>
                  ))}
              </div>
              <div>
                  <label htmlFor="brushSize" className="text-xs font-semibold mb-1 block">{t('imageEditModal.brushSize', language)}: {brushSize}px</label>
                  <input type="range" id="brushSize" min="2" max="200" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                  <h3 className="text-xs font-semibold mb-1">{t('imageEditModal.color', language)}</h3>
                  <div className="grid grid-cols-8 gap-1">
                      {LEGWEAR_PICKER_COLORS.slice(0, 16).map(color => (
                          <button
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              className={`w-full h-6 rounded-md border-2 transition-all ${selectedColor === color ? 'border-cyan-400 scale-110' : 'border-white/20'}`}
                              style={{ backgroundColor: COLOR_NAME_TO_HEX_MAP[color] }}
                              title={color}
                              aria-label={`Select color ${color}`}
                          />
                      ))}
                  </div>
              </div>
          </div>

          <div className="flex flex-col gap-2">
              <button onClick={clearMask} disabled={anyProcessing} className="w-full text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-3 rounded-md transition-colors disabled:opacity-50">
                {t('imageEditModal.clearMask', language)}
              </button>
              <button onClick={handleApply} disabled={anyProcessing} className="w-full text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-3 rounded-md transition-colors disabled:bg-slate-500">
                {anyProcessing ? t('imageEditModal.applying', language) : t('imageEditModal.apply', language)}
              </button>
              <button onClick={onCancel} disabled={anyProcessing} className="w-full text-xs bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-3 rounded-md transition-colors disabled:opacity-50">
                {t('imagePreview.cancelProofShot', language)}
              </button>
          </div>
        </div>
    </div>
  );
};

export default InlineImageEditor;