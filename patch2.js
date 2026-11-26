/* COMMANDO patch2.js (Phase 3+). patch.js ke BAAD yeh line add karein:
   <script src="patch2.js"></script>   Hatana ho to wo line mita dein. */
(function(){
if(typeof THREE==='undefined'||!document.getElementById('reloadBtn')) return;
const $=id=>document.getElementById(id);
const css=(el,s)=>{ el.style.cssText=s; document.body.appendChild(el); return el; };

/* ---------- HUD: health bar, toast, minimap ---------- */
const hb=css(document.createElement('div'),'position:fixed;bottom:12px;left:50%;transform:translateX(-50%);width:170px;height:10px;background:rgba(0,0,0,.6);border:1px solid #fff;z-index:10;pointer-events:none'),
      hf=document.createElement('div'); hf.style.cssText='height:100%;width:100%;background:#4c4'; hb.appendChild(hf);
const tt=css(document.createElement('div'),'position:fixed;top:14%;left:0;width:100%;text-align:center;color:#ffe040;font-size:20px;font-weight:bold;text-shadow:0 0 6px #000;z-index:12;pointer-events:none;opacity:0;transition:opacity .3s');
let tT=0; function toast(s,ms){ tt.innerText=s; tt.style.opacity=1; clearTimeout(tT); tT=setTimeout(()=>tt.style.opacity=0,ms||1600); }
const mm=css(document.createElement('canvas'),'position:fixed;top:112px;left:10px;width:124px;height:96px;border:1px solid #fff;z-index:10;pointer-events:none'); mm.width=124; mm.height=96; const mc=mm.getContext('2d');

/* ---------- distant gunshot: der se awaz, left/right pan, dhundli ---------- */
function farShot(dist,pan){
  if(!soundOn) return; initAudio(); let c=audioCtx, t=c.currentTime+Math.min(dist/343,.35), far=Math.min(dist/70,1);
  let bus=c.createGain(); bus.gain.value=Math.max(.1,.85-far*.7);
  let lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=9000-far*7500;
  let pn=c.createStereoPanner(); pn.pan.value=Math.max(-1,Math.min(1,pan));
  bus.connect(lp); lp.connect(pn); pn.connect(master); pn.connect(reverb); pn.connect(echo);
  noise(t,.045,'highpass',2500,.7*(1-far*.6),bus); noise(t,.14,'bandpass',1200,.6,bus); noise(t,.3,'lowpass',500,.8,bus); thump(t,140,38,.22,.9,bus);
}
const _pg2=playGun;
window.playGun=function(d,k){
  if(!d) return _pg2(d,k);
  let s=soundOn; soundOn=false; _pg2(d,k); soundOn=s;   /* purani awaz band, tracer chalta rahe */
  let sh=enemies.find(e=>!e.userData.dead&&e.userData.flashT>=.0599), pan=0;
  if(sh){ let dx=sh.position.x-camera.position.x, dz=sh.position.z-camera.position.z, L=Math.hypot(dx,dz)||1; pan=(dx*Math.cos(yaw)-dz*Math.sin(yaw))/L; }
  farShot(d,pan);
};

/* ---------- dushman: alag alag libaas, backpack, health bar, boss ---------- */
const vm=[0x8fa07a,0xc2b08a,0x7d858c].map(c=>{ let m=camoMat.clone(); m.color.set(c); return m; });
const bpG=new THREE.BoxGeometry(.34,.4,.16), bpM=new THREE.MeshLambertMaterial({color:0x3a3a2c});
const bgM=new THREE.SpriteMaterial({color:0x000000,transparent:true,opacity:.6}), fgM=new THREE.SpriteMaterial({color:0xe03030});
const _sp=spawn;
window.spawn=function(c){
  let e=_sp(c), u=e.userData, v=Math.random()*4|0;
  if(v<3) e.traverse(o=>{ if(o.isMesh&&o.material===camoMat) o.material=vm[v]; });
  e.scale.setScalar(.88*(.95+Math.random()*.15));
  let bp=new THREE.Mesh(bpG,bpM); bp.position.set(0,.5,-.32); u.torso.add(bp);
  let bg=new THREE.Sprite(bgM), fg=new THREE.Sprite(fgM); bg.scale.set(.74,.09,1); fg.scale.set(.7,.06,1); fg.center.set(0,.5);
  bg.position.set(0,2.45,0); fg.position.set(-.35,2.45,0); bg.visible=fg.visible=false; e.add(bg,fg);
  u.bg=bg; u.fg=fg; u.mhp=u.hp; return e;
};

/* ---------- loot drops ---------- */
const dg=new THREE.BoxGeometry(.4,.28,.4), dA=new THREE.MeshLambertMaterial({color:0x3f7a4a}), dH=new THREE.MeshLambertMaterial({color:0xd03030});
let drops=[];

/* ---------- missions + mahaul ---------- */
const MS=['Clear the warehouse','Clear the warehouse','Clear the warehouse','Clear all, then reach EXTRACTION','Heavy resistance: clear all','Heavy resistance: clear all','Clear all, then reach EXTRACTION','Heavy resistance: clear all','Last push: clear all','BOSS: kill the COMMANDER'];
const ATM=[[0xb4c0c8,.95],[0xb4c0c8,.95],[0xb4c0c8,.95],[0xd9a273,.8],[0xd9a273,.8],[0xc98a5e,.7],[0x6c7a96,.55],[0x6c7a96,.55],[0x4b556e,.45],[0x2a1a1c,.4]];
const hemi=scene.children.find(o=>o.isHemisphereLight);
let ext=null; const eG=new THREE.CylinderGeometry(1.5,1.5,14,16,1,true), eM=new THREE.MeshBasicMaterial({color:0xffe040,transparent:true,opacity:.3,side:THREE.DoubleSide});
const _ld=levelDone;
window.levelDone=function(){
  if((lvl===4||lvl===7)&&!ext){ ext=new THREE.Mesh(eG,eM); ext.position.set(Math.random()<.5?-50:50,7,36); scene.add(ext); toast('ALL CLEAR! Reach the EXTRACTION beam',3500); return; }
  _ld();
};
const _sl2=startLevel;
window.startLevel=function(){
  if(ext){ scene.remove(ext); ext=null; } drops.forEach(d=>scene.remove(d.m)); drops=[];
  _sl2();
  let a=ATM[Math.min(lvl,10)-1]; scene.background.set(a[0]); scene.fog.color.set(a[0]); sun.intensity=a[1]; if(hemi) hemi.intensity=.75*Math.min(1,a[1]/.95+.2);
  if(lvl===10&&enemies[0]){ let b=enemies[0], u=b.userData; u.hp*=6; u.mhp=u.hp; b.scale.multiplyScalar(1.35); }
  if(started) toast('LEVEL '+lvl+': '+MS[Math.min(lvl,10)-1],3000);
  pl=left;
};

/* ---------- har frame ---------- */
let lt=performance.now(), fr=0, pl=left;
function tick(){
  let n=performance.now(), dt=Math.min((n-lt)/1000,.05); lt=n; if(!started) return;
  hf.style.width=hp+'%'; hf.style.background=hp>50?'#4c4':hp>25?'#ec3':'#e33';
  if(left<pl) toast('ENEMY DOWN \u2014 '+left+' left',1200); pl=left;
  for(const e of enemies){ let u=e.userData;
    if(u.dead){ if(u.bg) u.bg.visible=u.fg.visible=false;
      if(!u.dropped){ u.dropped=1; if(Math.random()<.6){ let h=Math.random()<.4, m=new THREE.Mesh(dg,h?dH:dA); m.position.set(e.position.x,.3,e.position.z); scene.add(m); drops.push({m,h}); } } }
    else if(u.bg&&u.hp<u.mhp){ u.bg.visible=u.fg.visible=true; u.fg.scale.x=.7*Math.max(0,u.hp/u.mhp); } }
  for(let i=drops.length-1;i>=0;i--){ let d=drops[i]; d.m.rotation.y+=dt*2;
    if(Math.hypot(camera.position.x-d.m.position.x,camera.position.z-d.m.position.z)<1.6&&(d.h||!reloading)){
      if(d.h){ hp=Math.min(100,hp+25); $('hp').innerText=hp; toast('+25 HEALTH',1200); } else { ammo=W().mag; ammoW[1-cw]=WP[1-cw].mag; setAmmo(); toast('+AMMO (magazines full)',1200); }
      scene.remove(d.m); drops.splice(i,1); } }
  if(ext&&Math.hypot(camera.position.x-ext.position.x,camera.position.z-ext.position.z)<2.5){ scene.remove(ext); ext=null; _ld(); }
  if(++fr%2===0){ mc.fillStyle='rgba(0,0,0,.55)'; mc.fillRect(0,0,124,96);
    const P=(x,z)=>[x+62,z+48];
    for(const e of enemies) if(!e.userData.dead){ let p=P(e.position.x,e.position.z); mc.fillStyle=e.userData.mhp>6?'#f80':'#f33'; mc.fillRect(p[0]-1.5,p[1]-1.5,3,3); }
    for(const d of drops){ let p=P(d.m.position.x,d.m.position.z); mc.fillStyle=d.h?'#f66':'#6f6'; mc.fillRect(p[0]-1,p[1]-1,2,2); }
    if(ext){ let p=P(ext.position.x,ext.position.z); mc.strokeStyle='#ffe040'; mc.beginPath(); mc.arc(p[0],p[1],4,0,7); mc.stroke(); }
    let p=P(camera.position.x,camera.position.z); mc.save(); mc.translate(p[0],p[1]); mc.rotate(-yaw); mc.fillStyle='#fff'; mc.beginPath(); mc.moveTo(0,-5); mc.lineTo(3.5,4); mc.lineTo(-3.5,4); mc.fill(); mc.restore(); }
}
const _r2=renderer.render;
renderer.render=function(s,c){ tick(); return _r2.call(this,s,c); };
})();