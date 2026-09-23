import { useEffect, useRef, useState } from 'react';
import { Camera, Circle, Clock3, Crosshair, Focus, ImagePlus, LogOut, Maximize, Menu, Minus, MousePointer2, Plus, RectangleHorizontal, RotateCcw, Save, Settings2, Square, Trash2, VideoOff, X } from 'lucide-react';
import Logo from './components/Logo';
import Login from './components/Login';
import MeasurementCanvas from './components/MeasurementCanvas';

const api = window.easyGauge;
export default function App(){
  const [user,setUser]=useState(null); if(!user)return <Login onLogin={setUser}/>; return <Workspace user={user} logout={()=>setUser(null)}/>;
}

function Workspace({user,logout}){
 const [shape,setShape]=useState('rectangle'),[selection,setSelection]=useState(null),[image,setImage]=useState(null),[imageName,setImageName]=useState('No image loaded'),[cameraOn,setCameraOn]=useState(false),[zoom,setZoom]=useState(1),[ppu,setPpu]=useState(10),[unit,setUnit]=useState('mm'),[history,setHistory]=useState([]),[toast,setToast]=useState('');
 const videoRef=useRef(null), streamRef=useRef(null);
 const width=selection?.width||0,height=selection?.height||0, factor=unit==='px'?1:ppu;
 useEffect(()=>{loadHistory();return()=>stopCamera();},[]);
 async function loadHistory(){if(api)setHistory(await api.listMeasurements(user.id));}
 async function openImage(){stopCamera();let file;if(api)file=await api.openImage();else {const input=document.createElement('input');input.type='file';input.accept='image/*';input.click();file=await new Promise(r=>input.onchange=()=>{const f=input.files[0];if(!f)return r(null);const reader=new FileReader();reader.onload=()=>r({name:f.name,dataUrl:reader.result});reader.readAsDataURL(f);});}if(file){setImage(file.dataUrl);setImageName(file.name);setSelection(null);setZoom(1);}}
 async function startCamera(){try{stopCamera();const stream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:1920},height:{ideal:1080}}});streamRef.current=stream;setCameraOn(true);setImage(null);setImageName('Live camera');setSelection(null);setTimeout(()=>{if(videoRef.current){videoRef.current.srcObject=stream;videoRef.current.play();}},0);}catch{showToast('Camera access is unavailable');}}
 function stopCamera(){streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;setCameraOn(false);}
 function showToast(m){setToast(m);setTimeout(()=>setToast(''),2400);}
 async function save(){if(!selection||width<1||height<1)return showToast('Draw a measurement region first');const item={userId:user.id,imageName,shape,x:selection.x,y:selection.y,widthPx:width,heightPx:height,widthUnit:width/factor,heightUnit:height/factor,unit,pixelsPerUnit:ppu};if(api)await api.saveMeasurement(item);setHistory([{id:Date.now(),...item,createdAt:new Date().toISOString()},...history]);showToast('Measurement saved');}
 async function clearHistory(){if(api)await api.clearMeasurements(user.id);setHistory([]);}
 const shapeIcon={rectangle:RectangleHorizontal,square:Square,circle:Circle};
 return <div className="app-shell">
  <header className="topbar"><div className="top-left"><button className="icon-button menu"><Menu/></button><Logo compact/><span className="product-divider"/><span className="product-name">Easy Gauge</span></div><div className="top-status"><span className={`status-dot ${cameraOn?'online':''}`}/>{cameraOn?'CAMERA LIVE':'SYSTEM READY'}</div><div className="user-area"><div className="avatar">{user.displayName.charAt(0)}</div><div><b>{user.displayName}</b><small>Operator</small></div><button className="icon-button" title="Sign out" onClick={logout}><LogOut size={19}/></button></div></header>
  <main className="workspace">
   <aside className="leftbar">
    <section><label className="section-label">SOURCE</label><button className="source-card" onClick={openImage}><ImagePlus/><span><b>Open image</b><small>PNG, JPG, BMP, TIFF</small></span><Plus size={18}/></button><button className={`source-card ${cameraOn?'active':''}`} onClick={cameraOn?stopCamera:startCamera}>{cameraOn?<VideoOff/>:<Camera/>}<span><b>{cameraOn?'Stop camera':'Live camera'}</b><small>{cameraOn?'Streaming now':'Connect device'}</small></span><span className="live-pill">{cameraOn?'LIVE':''}</span></button></section>
    <section><label className="section-label">REGION OF INTEREST</label>{['rectangle','square','circle'].map(type=>{const Icon=shapeIcon[type];return <button key={type} onClick={()=>{setShape(type);setSelection(null)}} className={`tool-button ${shape===type?'active':''}`}><Icon/><span>{type[0].toUpperCase()+type.slice(1)}</span>{shape===type&&<span className="selected-check">✓</span>}</button>})}</section>
    <section><label className="section-label">CALIBRATION</label><div className="calibration"><span>Scale</span><div className="cal-row"><input type="number" min="0.01" step="0.1" value={ppu} onChange={e=>setPpu(Math.max(.01,+e.target.value))}/><small>px /</small><select value={unit} onChange={e=>setUnit(e.target.value)}><option>mm</option><option>cm</option><option>in</option><option>px</option></select></div><p>Set pixels per real-world unit.</p></div></section>
    <button className="settings-button"><Settings2 size={18}/> Device settings</button>
   </aside>
   <section className="stage-column">
    <div className="stage-toolbar"><div><b>{imageName}</b><span>{image||cameraOn?'Draw on the image to measure':'Choose a source to begin'}</span></div><div className="zoom-tools"><button onClick={()=>setZoom(z=>Math.max(.3,z-.1))}><Minus/></button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(z=>Math.min(3,z+.1))}><Plus/></button><button onClick={()=>setZoom(1)}><RotateCcw/></button></div></div>
    <div className="stage"><video ref={videoRef} muted playsInline className="hidden-video"/>{!image&&!cameraOn&&<div className="empty-stage"><div className="focus-art"><Focus/></div><h2>Your measurement canvas</h2><p>Open an image or start the live camera, then draw a region of interest.</p><div><button onClick={openImage}><ImagePlus/> Open image</button><button className="secondary" onClick={startCamera}><Camera/> Use camera</button></div></div>}<MeasurementCanvas image={image} videoRef={videoRef} cameraOn={cameraOn} shape={shape} selection={selection} onSelection={setSelection} zoom={zoom}/><div className="canvas-hint"><MousePointer2 size={14}/> Click and drag to define ROI</div></div>
    <div className="stage-footer"><span><Crosshair/> X {selection?selection.x.toFixed(0):'—'} &nbsp; Y {selection?selection.y.toFixed(0):'—'}</span><span><Maximize/> {selection?`${width.toFixed(0)} × ${height.toFixed(0)} px`:'No selection'}</span></div>
   </section>
   <aside className="rightbar">
    <div className="results-header"><div><span>MEASUREMENT</span><h2>Results</h2></div><button onClick={()=>setSelection(null)} title="Clear selection"><Trash2/></button></div>
    <div className="shape-badge">{(()=>{const I=shapeIcon[shape];return <I/>})()}<span>{shape} ROI</span></div>
    <div className="measurement-card"><span>WIDTH</span><div><strong>{selection?(width/factor).toFixed(2):'—'}</strong><small>{selection?unit:''}</small></div><p>{selection?`${width.toFixed(1)} pixels`:'Awaiting selection'}</p></div>
    <div className="measurement-card"><span>HEIGHT</span><div><strong>{selection?(height/factor).toFixed(2):'—'}</strong><small>{selection?unit:''}</small></div><p>{selection?`${height.toFixed(1)} pixels`:'Awaiting selection'}</p></div>
    {shape==='circle'&&<div className="mini-result"><span>Diameter</span><b>{selection?(width/factor).toFixed(2):'—'} {selection&&unit}</b></div>}
    <button className="save-button" onClick={save} disabled={!selection}><Save/> Save measurement</button>
    <div className="history-head"><span><Clock3/> Recent measurements</span>{history.length>0&&<button onClick={clearHistory}>Clear</button>}</div>
    <div className="history-list">{history.length===0?<div className="empty-history">Saved measurements will appear here.</div>:history.slice(0,5).map(h=><div className="history-item" key={h.id}><div className="history-icon">{h.shape?.[0]?.toUpperCase()}</div><div><b>{Number(h.widthUnit).toFixed(2)} × {Number(h.heightUnit).toFixed(2)} {h.unit}</b><small>{h.imageName||'Measurement'}</small></div></div>)}</div>
   </aside>
  </main>{toast&&<div className="toast">✓ {toast}</div>}
 </div>;
}
