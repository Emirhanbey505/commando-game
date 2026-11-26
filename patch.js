/* COMMANDO patch.js  (Phase 1 + 2)
   Istemal: index.html mein </body> se pehle, main </script> ke baad yeh ek line add karein:
   <script src="patch.js"></script>
   Hatana ho to bas wo line mita dein, purana game waisa hi chalega. */
(function(){
if(typeof THREE==='undefined'||typeof shoot!=='function') return;
const $=id=>document.getElementById(id);
let resv=[90,36], recoilOff=0, rid=0, fT=0, hmT=0, gq=1;

/* ---------- CSS, hit marker, buttons ---------- */
const st=document.createElement('style');
st.textContent='*{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}#hitm{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:34px;font-weight:bold;opacity:0;z-index:11;pointer-events:none;text-shadow:0 0 4px #000;transition:opacity .12s}';
document.head.appendChild(st);
document.addEventListener('contextmenu',e=>e.preventDefault());
const hm=document.createElement('div'); hm.id='hitm'; hm.innerText='\u2715'; document.body.appendChild(hm);
function showHit(k){ hm.style.color=k?'#f33':'#fff'; hm.style.opacity=1; clearTimeout(hmT); hmT=setTimeout(()=>hm.style.opacity=0,110); }
function mk(id,css,fn){ let b=document.createElement('button'); b.id=id; b.className='ctl'; b.style.cssText=css; document.body.appendChild(b); bind(id,fn); return b; }
mk('reloadBtn','bottom:32px;right:196px',()=>reload()).innerText='RELOAD';
const qb=mk('qBtn','top:10px;right:150px;border-radius:8px;width:auto;height:auto;padding:8px 12px;font-size:13px',()=>{ gq=(gq+1)%3; setQ(); });
function setQ(){ renderer.setPixelRatio([1,Math.min(devicePixelRatio,1.5),Math.min(devicePixelRatio,2)][gq]); renderer.setSize(innerWidth,innerHeight); sun.castShadow=gq>0; qb.innerText='GFX: '+['LOW','MED','HIGH'][gq]; }
setQ();

/* ---------- touch cancel fix (joystick atakna) ---------- */
document.addEventListener('touchcancel',e=>{ for(let t of e.changedTouches){ if(t.identifier===lookTouchId) lookTouchId=null; if(t.identifier===joyTouchId){ joyTouchId=null; resetJoy(); } } });

/* ---------- effects: muzzle flash, tracers, particles ---------- */
const gc=document.createElement('canvas'); gc.width=gc.height=64;
{ let x=gc.getContext('2d'), g=x.createRadialGradient(32,32,2,32,32,32); g.addColorStop(0,'rgba(255,240,180,1)'); g.addColorStop(.35,'rgba(255,160,50,.8)'); g.addColorStop(1,'rgba(255,100,0,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); }
const pF=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(gc),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
pF.scale.set(.42,.42,1); pF.visible=false; camera.add(pF);
const parts=[], trs=[], pg=new THREE.BoxGeometry(1,1,1), pm={}, _lo=new THREE.Raycaster();
const pmat=c=>pm[c]||(pm[c]=new THREE.MeshBasicMaterial({color:c}));
function addP(p,v,c,t,s){ let m=new THREE.Mesh(pg,pmat(c)); m.scale.setScalar(s); m.position.copy(p); scene.add(m); parts.push({m,v,t}); }
function burst(p,c,n,sp,t){ for(let i=0;i<n;i++) addP(p,new THREE.Vector3((Math.random()-.5)*sp,Math.random()*sp*.8,(Math.random()-.5)*sp),c,t*(.6+Math.random()*.6),.035); }
function tracer(a,b,c){ let m=new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),new THREE.LineBasicMaterial({color:c,transparent:true,opacity:.85})); scene.add(m); trs.push({m,t:.08}); }
function flash(){ pF.position.set(W().x,W().y+.03,W().z+(cw?-.2:-.78)); pF.material.rotation=Math.random()*6; pF.visible=true; fT=.05; }
function muzzle(){ pF.updateWorldMatrix(true,false); return pF.getWorldPosition(new THREE.Vector3()); }
function eject(){ let r=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion), p=camera.position.clone().addScaledVector(r,.2); p.y-=.18; addP(p,r.clone().multiplyScalar(1.6+Math.random()).add(new THREE.Vector3(0,1.6,0)),0xc8a040,.7,.03); }
function seen(a,b){ let d=b.clone().sub(a), l=d.length(); _lo.set(a,d.normalize()); _lo.far=l; return _lo.intersectObjects(blk).length===0; }
function free(e){ e.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material&&o.material!==camoMat&&o.material!==camoHelm) o.material.dispose(); }); scene.remove(e); }

/* enemy ki gaoli ka tracer */
const _pg=playGun;
window.playGun=function(d,k){ _pg(d,k); if(d&&started){ for(const e of enemies){ if(!e.userData.dead&&e.userData.flashT>=.0599){
  let f=new THREE.Vector3(Math.sin(e.rotation.y),0,Math.cos(e.rotation.y)), a=new THREE.Vector3(e.position.x,1.3,e.position.z).addScaledVector(f,.8), b=camera.position.clone();
  b.x+=(Math.random()-.5)*1.6; b.y+=(Math.random()-.5)*1.2; b.z+=(Math.random()-.5)*1.6; tracer(a,b,0xff8a40); break; } } } };

/* ---------- ammo reserve + reload ---------- */
window.setAmmo=function(){ $('ammo').innerText=reloading?'RELOAD...':ammo+' / '+resv[cw]; };
window.reload=function(){
  if(reloading||over||!started) return; let need=W().mag-ammo; if(need<=0||resv[cw]<=0) return;
  reloading=true; setAmmo(); playReload(); let r0=rid;
  setTimeout(()=>{ if(r0!==rid) return; let t=Math.min(need,resv[cw]); resv[cw]-=t; ammo+=t; reloading=false; setAmmo(); },1500);
};

/* ---------- shoot (tracer, flash, hit marker, blood, recoil recovery, headshot fix) ---------- */
window.shoot=function(){
  if(over||reloading||!started) return; let now=performance.now(); if(now-lastShot<W().gap) return; lastShot=now;
  if(ammo<=0){ reload(); return; }
  ammo--; setAmmo(); playGun(0,cw);
  muzzleLight.intensity=3; setTimeout(()=>muzzleLight.intensity=0,50); flash(); eject();
  gunGroup.position.z=W().z+.09; gunGroup.rotation.x=.07; setTimeout(()=>{ gunGroup.position.z=W().z; gunGroup.rotation.x=0; },70);
  recoilOff=Math.min(.3,recoilOff+W().rec);
  let sp=W().spread*(crouch?.6:1)*(jumpY>.1?2.5:1); ray.setFromCamera({x:(Math.random()-.5)*sp,y:(Math.random()-.5)*sp},camera);
  let all=[]; enemies.forEach(e=>{ if(!e.userData.dead) e.traverse(c=>{ if(c.isMesh&&c!==e.userData.flashM) all.push(c); }); });
  let hits=ray.intersectObjects(all), cb=ray.intersectObjects(blk), end=null;
  if(cb.length&&(!hits.length||cb[0].distance<hits[0].distance)){ playRicochet(); burst(cb[0].point,0xffd070,5,4,.35); end=cb[0].point; hits=[]; }
  if(hits.length){
    let h=hits[0], p=h.object; while(p.parent!==scene) p=p.parent;
    p.userData.hp-=(h.point.y>1.66)?2:1; playHit(); burst(h.point,0xaa1010,7,3.5,.7); end=h.point;
    let k=p.userData.hp<=0; showHit(k);
    if(k){ p.userData.dead=true; playGrunt(); left--; $('left').innerText=left; if(left===0&&!over) levelDone(); }
  }
  tracer(muzzle(),end||ray.ray.at(90,new THREE.Vector3()),0xffe9a0);
  if(ammo===0) setTimeout(reload,300);
};

/* ---------- grenade: dewar ke pichhe nahi marta ---------- */
window.explode=function(p){
  playBoom(); shake=.7; let fm=new THREE.Mesh(new THREE.SphereGeometry(1,12,10),new THREE.MeshBasicMaterial({color:0xff9a30,transparent:true,opacity:.9}));
  fm.position.copy(p); scene.add(fm); blastLight.position.copy(p); blastLight.intensity=6; fx.push({fm,t:0});
  let o=new THREE.Vector3(p.x,Math.max(p.y,.5),p.z);
  enemies.forEach(e=>{ if(e.userData.dead) return; let d=Math.hypot(e.position.x-p.x,e.position.z-p.z); if(d<9&&seen(o,new THREE.Vector3(e.position.x,1,e.position.z))) dmg(e,d<4?9:3); });
  let dp=Math.hypot(camera.position.x-p.x,camera.position.z-p.z); if(dp<8&&!over&&seen(o,camera.position)) hurt(Math.round(45*(1-dp/8))+5);
};

/* ---------- level start: memory saaf, reserve reset ---------- */
const _sl=startLevel;
window.startLevel=function(){ rid++; enemies.forEach(free); resv=[90,36]; recoilOff=0; _sl(); };

/* ---------- audio: lambi noise buffer (dhamake ki awaz kat jati thi) ---------- */
const _ia=initAudio;
window.initAudio=function(){ let f=!audioCtx; _ia(); if(f&&audioCtx){ let b=audioCtx.createBuffer(1,audioCtx.sampleRate*2,audioCtx.sampleRate), d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; noiseBuf=b; } };

/* ---------- har frame: FPS-independent speed, recoil wapsi, effects update ---------- */
let lt=performance.now(), prev=new THREE.Vector3();
function tick(){
  let n=performance.now(), dt=Math.min((n-lt)/1000,.05); lt=n;
  if(started){
    if(!over){ let dx=camera.position.x-prev.x, dz=camera.position.z-prev.z;
      if((dx||dz)&&Math.hypot(dx,dz)<1){ let k=dt*60; camera.position.x=Math.max(-60,Math.min(60,prev.x+dx*k)); camera.position.z=Math.max(-45,Math.min(45,prev.z+dz*k)); resolve(camera.position,.5); } }
    recoilOff*=Math.max(0,1-dt*7); camera.rotation.x=pitch+recoilOff;
    gunGroup.position.y+=((W().y-(reloading?.14:0))-gunGroup.position.y)*Math.min(1,dt*10);
    if(fT>0){ fT-=dt; if(fT<=0) pF.visible=false; }
    for(let i=parts.length-1;i>=0;i--){ let a=parts[i]; a.t-=dt; a.v.y-=9*dt; a.m.position.addScaledVector(a.v,dt); if(a.m.position.y<.02){ a.m.position.y=.02; a.v.set(0,0,0); } if(a.t<=0){ scene.remove(a.m); parts.splice(i,1); } }
    for(let i=trs.length-1;i>=0;i--){ let a=trs[i]; a.t-=dt; a.m.material.opacity=Math.max(0,a.t*11); if(a.t<=0){ scene.remove(a.m); a.m.geometry.dispose(); a.m.material.dispose(); trs.splice(i,1); } }
    for(const e of enemies){ if(e.rotation.order!=='YXZ') e.rotation.order='YXZ'; if(e.userData.dead&&!e.parent&&!e.userData.freed){ e.userData.freed=1; free(e); } }
  }
  prev.copy(camera.position);
}
const _r=renderer.render;
renderer.render=function(s,c){ tick(); return _r.call(this,s,c); };
setAmmo();
})();