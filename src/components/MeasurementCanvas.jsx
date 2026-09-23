import { useEffect, useRef, useState } from 'react';

export default function MeasurementCanvas({ image, videoRef, cameraOn, shape, selection, onSelection, zoom }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const drag = useRef(null);
  const [display, setDisplay] = useState({ scale: 1, ox: 0, oy: 0, w: 0, h: 0, sourceW: 0, sourceH: 0 });

  useEffect(() => {
    if (!image) { imgRef.current = null; return; }
    const img = new Image();
    img.onload = () => { imgRef.current = img; draw(); };
    img.src = image;
  }, [image]);

  useEffect(() => { draw(); }, [selection, shape, cameraOn, zoom]);
  useEffect(() => {
    const resize = new ResizeObserver(draw); if (canvasRef.current) resize.observe(canvasRef.current.parentElement);
    let frame; const tick=()=>{ if(cameraOn) draw(); frame=requestAnimationFrame(tick); }; frame=requestAnimationFrame(tick);
    return ()=>{resize.disconnect();cancelAnimationFrame(frame);};
  }, [cameraOn, selection, zoom]);

  function draw() {
    const canvas = canvasRef.current; if (!canvas) return;
    const box = canvas.parentElement.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1; canvas.width = box.width*ratio; canvas.height=box.height*ratio; canvas.style.width=`${box.width}px`;canvas.style.height=`${box.height}px`;
    const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);ctx.fillStyle='#111a1d';ctx.fillRect(0,0,box.width,box.height);
    const source = cameraOn && videoRef.current?.videoWidth ? videoRef.current : imgRef.current;
    if (!source) return;
    const sw=source.videoWidth||source.naturalWidth, sh=source.videoHeight||source.naturalHeight;
    const fit=Math.min(box.width/sw,box.height/sh)*zoom; const w=sw*fit,h=sh*fit,ox=(box.width-w)/2,oy=(box.height-h)/2;
    ctx.drawImage(source,ox,oy,w,h); setDisplay(d=> (d.w===w&&d.h===h&&d.ox===ox&&d.oy===oy?d:{scale:fit,ox,oy,w,h,sourceW:sw,sourceH:sh}));
    if(selection){
      const x=ox+selection.x*fit,y=oy+selection.y*fit,rw=selection.width*fit,rh=selection.height*fit;
      ctx.save();ctx.strokeStyle='#35dfcd';ctx.lineWidth=2;ctx.setLineDash([7,4]);ctx.shadowColor='rgba(53,223,205,.55)';ctx.shadowBlur=8;
      if(shape==='circle'){ctx.beginPath();ctx.ellipse(x+rw/2,y+rh/2,Math.abs(rw/2),Math.abs(rh/2),0,0,Math.PI*2);ctx.stroke();}
      else ctx.strokeRect(x,y,rw,rh);
      ctx.setLineDash([]);ctx.fillStyle='#35dfcd';[[x,y],[x+rw,y],[x,y+rh],[x+rw,y+rh]].forEach(([px,py])=>{ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);ctx.fill();});ctx.restore();
    }
  }

  function point(e){const r=canvasRef.current.getBoundingClientRect();return{x:Math.max(0,Math.min(display.sourceW,(e.clientX-r.left-display.ox)/display.scale)),y:Math.max(0,Math.min(display.sourceH,(e.clientY-r.top-display.oy)/display.scale))};}
  function down(e){if(!display.sourceW)return;const p=point(e);drag.current=p;canvasRef.current.setPointerCapture(e.pointerId);onSelection({x:p.x,y:p.y,width:0,height:0});}
  function move(e){if(!drag.current)return;const p=point(e),s=drag.current;let w=p.x-s.x,h=p.y-s.y;if(shape==='square'||shape==='circle'){const side=Math.min(Math.abs(w),Math.abs(h));w=Math.sign(w||1)*side;h=Math.sign(h||1)*side;}onSelection({x:w<0?s.x+w:s.x,y:h<0?s.y+h:s.y,width:Math.abs(w),height:Math.abs(h)});}
  function up(){drag.current=null;}
  return <canvas ref={canvasRef} className="measurement-canvas" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}/>;
}
