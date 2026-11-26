/* COMMANDO patch3.js: scope (3x/4x), asli jaisi rifle, dhamake wale petrol drum.
   patch2.js ke BAAD yeh line add karein:  <script src="patch3.js"></script>   Hatana ho to wo line mita dein. */
(function(){
if(typeof THREE==='undefined'||!document.getElementById('reloadBtn')) return;
const $=id=>document.getElementById(id);
function mk(id,css,fn){ let b=document.createElement('button'); b.id=id; b.className='ctl'; b.style.cssText=css; document.body.appendChild(b); bind(id,fn); return b; }

/* ---------- 1) ASLI JAISI RIFLE (M416 style: rail, red-dot, foregrip, mag, stock) ---------- */
const bm=new THREE.MeshPhongMaterial({color:0x17191b,shininess:60}), gm=new THREE.MeshPhongMaterial({color:0x33373b,shininess:90}),
      lens=new THREE.MeshPhongMaterial({color:0x6aa0c0,transparent:true,opacity:.35,shininess:100}), dot=new THREE.MeshBasicMaterial({color:0xff2a2a});
function makeM4(){ let g=new THREE.Group(), p=(geo,m,x,y,z,rx)=>part(g,geo,m,x,y,z,rx);
  p(GB(.06,.08,.4),bm,0,0,.02); p(GB(.056,.07,.24),bm,0,-.07,.06);                                   // upper + lower receiver
  p(GB(.04,.014,.56),gm,0,.047,-.06); for(let i=0;i<10;i++) p(GB(.046,.008,.012),gm,0,.056,-.3+i*.055); // top rail
  p(GB(.066,.075,.36),bm,0,0,-.37); for(let i=0;i<6;i++) p(GB(.07,.012,.02),gm,0,.022,-.52+i*.06);    // handguard + slots
  p(GC(.011,.2),gm,0,.005,-.66,Math.PI/2); p(GC(.019,.07),gm,0,.005,-.77,Math.PI/2); p(GB(.012,.05,.012),gm,0,.075,-.6); // barrel, flash hider, front sight
  p(GB(.05,.02,.08),gm,0,.064,.07); p(GB(.046,.052,.08),bm,0,.1,.07); p(GB(.032,.034,.004),lens,0,.1,.028); p(GB(.006,.006,.004),dot,0,.1,.027); // red dot
  p(GB(.03,.11,.036),bm,0,-.09,-.33,-.1);                                                             // foregrip
  p(GB(.042,.17,.065),bm,0,-.17,0,.1); p(GB(.044,.05,.07),gm,0,-.27,-.01,.12);                        // magazine
  p(GB(.042,.11,.055),bake,0,-.14,.19,-.3);                                                           // pistol grip
  p(GC(.02,.2),gm,0,-.005,.33,Math.PI/2); p(GB(.05,.1,.17),bm,0,-.02,.47); p(GB(.054,.115,.02),gm,0,-.02,.565); // buffer tube, stock, pad
  p(GB(.075,.07,.11),glove,-.012,-.14,-.33); p(GB(.085,.085,.32),sleeveM,-.14,-.2,-.14,.35).rotation.y=.35;
  p(GB(.07,.085,.085),glove,0,-.17,.2); p(GB(.09,.09,.34),sleeveM,.09,-.3,.4,-.5).rotation.y=-.2;
  return g; }
WP[0].n='M416'; WP[0].build=makeM4; buildGun();

/* ---------- 2) SCOPE: SCOPE button dabayein: 3x, phir 4x, phir band (sirf rifle par) ---------- */
const ZS=[1,3,4], w0=WP.map(w=>w.spread), pF=camera.children.find(o=>o.isSprite); let zoom=1, zi=0;
const sb=mk('scopeBtn','bottom:110px;right:176px',()=>{ if(started&&!over&&cw===0) setZoom((zi+1)%3); }); sb.innerText='SCOPE';
function setZoom(i){ zi=i; zoom=ZS[i]; WP.forEach((w,k)=>w.spread=w0[k]*(zoom>1?.35:1)); sb.innerText=zoom>1?zoom+'x':'SCOPE'; }
const ov=document.createElement('div'); ov.style.cssText='position:fixed;inset:0;z-index:8;pointer-events:none;opacity:0;transition:opacity .15s;background:linear-gradient(#000,#000) center/1px 76vmin no-repeat,linear-gradient(#000,#000) center/76vmin 1px no-repeat,radial-gradient(circle at center,transparent 0,transparent 37vmin,#000 38.5vmin)';
document.body.appendChild(ov);
/* zoom mein look slow (sensitivity / zoom) */
window.addEventListener('touchmove',e=>{ if(zoom>1) for(let t of e.changedTouches) if(t.identifier===lookTouchId){ lastLookX=t.clientX-(t.clientX-lastLookX)/zoom; lastLookY=t.clientY-(t.clientY-lastLookY)/zoom; } },{capture:true,passive:true});

/* ---------- 3) PETROL DRUM: goli lage to dhamaka, aas paas ke drum bhi phatte hain ---------- */
const fuel=[], scorch=[], deb=[]; let gen=0;
blk.filter(m=>m.geometry&&m.geometry.type==='CylinderGeometry'&&m.geometry.parameters.height===1.1).forEach(m=>{
  let c=cols.find(c=>Math.abs((c.x0+c.x1)/2-m.position.x)<.01&&Math.abs((c.z0+c.z1)/2-m.position.z)<.01&&Math.abs(c.x1-c.x0-.8)<.01);
  m.material.color.set(0xb3261a);
  [-.22,.22].forEach(y=>{ let b=new THREE.Mesh(new THREE.CylinderGeometry(.41,.41,.1,12),new THREE.MeshLambertMaterial({color:0xe8c030})); b.position.y=y; m.add(b); });
  fuel.push({m,c}); });
const dgG=new THREE.BoxGeometry(.09,.09,.09), dgM=new THREE.MeshBasicMaterial({color:0x2a2018});
function trig(m,d){ if(m.userData.boom) return; m.userData.boom=true; let r=gen; setTimeout(()=>{ if(r===gen) boom(m); },d); }
function boom(m){
  let o=fuel.find(f=>f.m===m); if(!o||!m.parent) return; let p=m.position.clone();
  scene.remove(m); let i=blk.indexOf(m); if(i>=0) blk.splice(i,1); i=cols.indexOf(o.c); if(i>=0) cols.splice(i,1);
  explode(new THREE.Vector3(p.x,.6,p.z));
  let s=new THREE.Mesh(new THREE.CircleGeometry(1.4,16),new THREE.MeshBasicMaterial({color:0x111111,transparent:true,opacity:.7})); s.rotation.x=-Math.PI/2; s.position.set(p.x,.04,p.z); scene.add(s); scorch.push(s);
  for(let k=0;k<12;k++){ let d=new THREE.Mesh(dgG,dgM); d.position.copy(p); d.position.y=.5; scene.add(d); deb.push({m:d,v:new THREE.Vector3((Math.random()-.5)*9,3+Math.random()*6,(Math.random()-.5)*9),t:1.6}); }
}
function resetFuel(){ gen++; scorch.forEach(s=>scene.remove(s)); scorch.length=0; deb.forEach(d=>scene.remove(d.m)); deb.length=0;
  fuel.forEach(o=>{ if(!o.m.parent){ scene.add(o.m); blk.push(o.m); if(o.c) cols.push(o.c); } o.m.userData.boom=false; }); }
function barrelHit(){
  let b=ray.intersectObjects(blk)[0]; if(!b||b.object.userData.boom||!fuel.some(f=>f.m===b.object)) return;
  let es=[]; enemies.forEach(e=>{ if(!e.userData.dead) e.traverse(c=>{ if(c.isMesh) es.push(c); }); });
  let h=ray.intersectObjects(es)[0]; if(h&&h.distance<b.distance) return; trig(b.object,0);
}
const _s=shoot; window.shoot=function(){ let a=ammo; _s(); if(ammo<a) barrelHit(); };
const _ex=explode; window.explode=function(p){ _ex(p); fuel.forEach(o=>{ if(Math.hypot(o.m.position.x-p.x,o.m.position.z-p.z)<5) trig(o.m,150+Math.random()*250); }); };
const _sl3=startLevel; window.startLevel=function(){ resetFuel(); setZoom(0); _sl3(); };

/* ---------- har frame ---------- */
let lt=performance.now();
function tick(){
  let n=performance.now(), dt=Math.min((n-lt)/1000,.05); lt=n; if(!started) return;
  if(cw!==0&&zi) setZoom(0);
  let tf=2*Math.atan(Math.tan(37.5*Math.PI/180)/zoom)*180/Math.PI;
  if(Math.abs(camera.fov-tf)>.05){ camera.fov+=(tf-camera.fov)*Math.min(1,dt*12); camera.updateProjectionMatrix(); }
  ov.style.opacity=(zoom>1&&camera.fov<55)?1:0; gunGroup.visible=zoom<=1; $('cross').style.display=zoom>1?'none':''; if(zoom>1&&pF) pF.visible=false;
  for(let i=deb.length-1;i>=0;i--){ let d=deb[i]; d.t-=dt; d.v.y-=14*dt; d.m.position.addScaledVector(d.v,dt); if(d.m.position.y<.05){ d.m.position.y=.05; d.v.set(0,0,0); } if(d.t<=0){ scene.remove(d.m); deb.splice(i,1); } }
}
const _r3=renderer.render;
renderer.render=function(s,c){ tick(); return _r3.call(this,s,c); };
})();