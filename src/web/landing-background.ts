/** Self-contained landing/entry atmosphere renderer. No business state, transport or external assets. */
export const LANDING_BACKGROUND_SCRIPT = String.raw`(()=>{
 const layer=document.getElementById('landing-atmosphere'),canvas=document.getElementById('landing-waves'),brand=document.getElementById('brand'),cursor=brand.querySelector('.cursor');
 const login=document.getElementById('login'),home=document.getElementById('home'),app=document.getElementById('app'),workspace=document.getElementById('case-workspace'),progress=document.getElementById('progress'),candidatePanel=document.getElementById('candidate-panel');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let gl=null,program=null,resolution=null,clock=null,pulseUniform=null,focusUniform=null,stageCenterUniform=null,stageCenterX=.5,focusValue=0,unavailable=false,active=false,raf=0,timer=0,last=0,time=0,dirty=true;
 const visible=()=>active&&!document.hidden&&!reduced.matches&&!unavailable;
 const stop=()=>{cancelAnimationFrame(raf);clearTimeout(timer);raf=timer=last=0;};
 function syncCursor(){const converged=layer.dataset.mode==='converged';brand.classList.toggle('orb-synced',converged);if(!converged)cursor.style.removeProperty('--orb-opacity');else if(reduced.matches||unavailable)cursor.style.setProperty('--orb-opacity','1');}
 const fallback=()=>{stop();unavailable=true;canvas.hidden=true;layer.dataset.renderer='static';syncCursor();};
 function initialize(){
  try{
   gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:'low-power'});
   if(!gl)return fallback();
   const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw new Error();}return s;};
   const vertex=shader(gl.VERTEX_SHADER,'#version 300 es\nin vec2 position;void main(){gl_Position=vec4(position,0.0,1.0);}');
   const fragment=shader(gl.FRAGMENT_SHADER,"#version 300 es\nprecision mediump float;\nuniform vec2 resolution;uniform float clock;uniform float pulse;uniform float focus;uniform float stageCenterX;out vec4 color;\nfloat glow(vec2 p,vec2 center,vec2 radius){vec2 d=(p-center)/radius;return exp(-dot(d,d)*2.0);}\nvoid main(){\n vec2 uv=gl_FragCoord.xy/resolution;float aspect=resolution.x/resolution.y;\n vec2 p=vec2((uv.x-0.5)*aspect,uv.y-0.5);\n float minDim=min(resolution.x,resolution.y);\n vec2 stageCenter=vec2(mix(0.5,stageCenterX,focus),mix(0.5,0.48,focus));\n vec2 pc=(gl_FragCoord.xy-stageCenter*resolution)/minDim;vec2 q=mix(p,pc,focus);\n float t=clock;float breath=clock*mix(1.0,1.4,focus);float drift=mix(1.0,0.05,focus);float r=mix(0.21,0.31,pulse);\n vec2 a=vec2(-0.18+sin(t*0.23)*0.16,0.12+cos(t*0.19)*0.12)*drift;\n vec2 b=vec2(0.24+cos(t*0.17)*0.18,-0.04+sin(t*0.27)*0.13)*drift;\n vec2 c=vec2(-0.12+cos(t*0.21+2.0)*0.20,-0.20+sin(t*0.16)*0.13)*drift;\n vec2 d=vec2(0.12+sin(t*0.14+1.0)*0.22,0.27+cos(t*0.24)*0.12)*drift;\n a=mix(vec2(-0.40+sin(t*0.23)*0.22,-0.24+cos(t*0.19)*0.16),a,focus);\n b=mix(vec2(0.40+cos(t*0.17)*0.22,-0.30+sin(t*0.27)*0.15),b,focus);\n c=mix(vec2(-0.46+cos(t*0.21+2.0)*0.24,0.05+sin(t*0.16)*0.24),c,focus);\n d=mix(vec2(0.18+sin(t*0.14+1.0)*0.30,0.28+cos(t*0.24)*0.18),d,focus);\n float light=glow(q,a,mix(vec2(0.56,0.44),vec2(r),focus))*(0.15+0.045*sin(breath*0.48));\n light+=glow(q,b,mix(vec2(0.54,0.46),vec2(r),focus))*(0.13+0.04*cos(breath*0.41));\n light+=glow(q,c,mix(vec2(0.60,0.46),vec2(r),focus))*(0.11+0.035*sin(breath*0.37+1.0));\n light+=glow(q,d,mix(vec2(0.56,0.42),vec2(r),focus))*(0.10+0.03*cos(breath*0.33));\n float edge=smoothstep(0.0,0.12,uv.x)*smoothstep(0.0,0.12,1.0-uv.x)*smoothstep(0.0,0.16,uv.y)*smoothstep(0.0,0.16,1.0-uv.y);edge=mix(0.75+0.25*edge,edge,focus);light*=mix(edge,1.0,focus);\n vec3 brand=vec3(0.239,0.353,0.996);color=vec4(mix(vec3(1.0),brand,min(light*mix(1.0,mix(0.50,0.95,pulse),focus),mix(0.38,mix(0.14,0.30,pulse),focus))),1.0);\n}");
   program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error();
   gl.useProgram(program);const vao=gl.createVertexArray();gl.bindVertexArray(vao);const quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
   const location=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
   resolution=gl.getUniformLocation(program,'resolution');clock=gl.getUniformLocation(program,'clock');pulseUniform=gl.getUniformLocation(program,'pulse');focusUniform=gl.getUniformLocation(program,'focus');stageCenterUniform=gl.getUniformLocation(program,'stageCenterX');
  }catch{fallback();}
 }
 function frame(now){
  raf=0;if(!visible())return;
  try{
   if(dirty){const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.round(innerWidth*dpr));canvas.height=Math.max(1,Math.round(innerHeight*dpr));gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(resolution,canvas.width,canvas.height);dirty=false;}
   const dt=last?Math.min(now-last,100)/1000:0;time+=dt;last=now;focusValue+=((layer.dataset.mode==='converged'?1:0)-focusValue)*Math.min(1,dt*4.5);const pulse=.5+.5*Math.sin(time*2.85);gl.uniform1f(clock,time);gl.uniform1f(pulseUniform,pulse);gl.uniform1f(focusUniform,focusValue);gl.uniform1f(stageCenterUniform,stageCenterX);if(layer.dataset.mode==='converged')cursor.style.setProperty('--orb-opacity',String(.35+.65*pulse));gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
   timer=setTimeout(()=>{timer=0;if(visible())raf=requestAnimationFrame(frame);},1000/30);
  }catch{fallback();}
 }
 function sync(){
  stageCenterX=innerWidth>=960&&!document.body.classList.contains('sidebar-collapsed')?0.5+112/innerWidth:0.5;layer.style.setProperty('--stage-center-x',(stageCenterX*100)+'%');
  const mode=!login.hidden||(!app.hidden&&!home.hidden&&workspace.hidden)?'landing':!app.hidden&&!workspace.hidden&&workspace.dataset.view==='CANDIDATES'&&candidatePanel.hidden&&!progress.hidden?'converged':'off';layer.dataset.mode=mode;active=mode!=='off';layer.dataset.active=String(active);syncCursor();
  if(reduced.matches||unavailable)layer.dataset.renderer='static';
  if(!visible()){stop();if(reduced.matches)canvas.hidden=true;return;}
  if(!gl)initialize();if(unavailable)return;canvas.hidden=false;layer.dataset.renderer='webgl';
  if(!raf&&!timer)raf=requestAnimationFrame(frame);
 }
 const observer=new MutationObserver(sync);for(const node of[login,home,app,workspace,progress,candidatePanel])observer.observe(node,{attributes:true,attributeFilter:['hidden','data-view']});
 observer.observe(document.body,{attributes:true,attributeFilter:['class']});
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
 window.addEventListener('resize',()=>{dirty=true;sync();});
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback();});
 window.addEventListener('pagehide',stop);window.addEventListener('pageshow',sync);sync();
})();`;
