/*  js/blackhole_pure.js – Black-hole scene (pure ES module)  */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Constants for sizes
const BLACK_HOLE_RADIUS = 1.3;
const DISK_INNER_RADIUS = BLACK_HOLE_RADIUS + 0.2;
const DISK_OUTER_RADIUS = 8.0;
const DISK_TILT_ANGLE = Math.PI / 3.0;
const STAR_COUNT = 150000;
const STAR_FIELD_RADIUS = 2000;

// Scene & renderer
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020104, 0.025);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 4000);
camera.position.set(-6.5, 5.0, 6.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// Post-processing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.7, 0.8);
composer.addPass(bloomPass);

const lensingShader = {
  uniforms: {
    tDiffuse: { value: null },
    blackHoleScreenPos: { value: new THREE.Vector2(0.5, 0.5) },
    lensingStrength: { value: 0.12 },
    lensingRadius: { value: 0.3 },
    aspectRatio: { value: window.innerWidth / window.innerHeight },
    chromaticAberration: { value: 0.005 }
  },
  vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 blackHoleScreenPos; uniform float lensingStrength; uniform float lensingRadius; uniform float aspectRatio; uniform float chromaticAberration; varying vec2 vUv;
    void main(){
      vec2 sp=vUv; vec2 toC=sp-blackHoleScreenPos; toC.x*=aspectRatio; float d=length(toC);
      float k=lensingStrength/(d*d+0.003); k=clamp(k,0.0,0.7)*smoothstep(lensingRadius,lensingRadius*0.3,d);
      vec2 off=normalize(toC)*k; off.x/=aspectRatio;
      vec2 r=sp-off*(1.0+chromaticAberration), g=sp-off, b=sp-off*(1.0-chromaticAberration);
      gl_FragColor=vec4(texture2D(tDiffuse,r).r,texture2D(tDiffuse,g).g,texture2D(tDiffuse,b).b,1.0);
    }`
};
const lensingPass = new ShaderPass(lensingShader);
composer.addPass(lensingPass);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.035;
controls.rotateSpeed = 0.4; controls.autoRotate = false; controls.autoRotateSpeed = 0.1;
controls.target.set(0, 0, 0);
controls.minDistance = 2.5; controls.maxDistance = 100; controls.enablePan = false;
controls.update();

// UI – auto-rotate toggle (expects #autoRotateToggle element in the page)
let autoRotateEnabled = false;
const autoRotateToggle = document.getElementById('autoRotateToggle');
if (autoRotateToggle) {
  const icon = '<svg class="rotate-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';
  const updateLabel = () => autoRotateToggle.innerHTML = icon + `<span>Auto-Rotate: ${autoRotateEnabled ? 'ON' : 'OFF'}</span>`;
  updateLabel();
  autoRotateToggle.addEventListener('click', () => { autoRotateEnabled = !autoRotateEnabled; controls.autoRotate = autoRotateEnabled; updateLabel(); });
}

// Starfield
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(STAR_COUNT * 3);
const starColors = new Float32Array(STAR_COUNT * 3);
const starSizes = new Float32Array(STAR_COUNT);
const starTwinkle = new Float32Array(STAR_COUNT);
const palette = [0x88aaff,0xffaaff,0xaaffff,0xffddaa,0xffeecc,0xffffff,0xff8888,0x88ff88,0xffff88,0x88ffff].map(c=>new THREE.Color(c));
for(let i=0;i<STAR_COUNT;i++){
  const i3=i*3; const phi=Math.acos(-1+(2*i)/STAR_COUNT); const theta=Math.sqrt(STAR_COUNT*Math.PI)*phi; const r=Math.cbrt(Math.random())*STAR_FIELD_RADIUS+100;
  starPositions[i3]=r*Math.sin(phi)*Math.cos(theta); starPositions[i3+1]=r*Math.sin(phi)*Math.sin(theta); starPositions[i3+2]=r*Math.cos(phi);
  const col=palette[Math.floor(Math.random()*palette.length)].clone().multiplyScalar(Math.random()*0.7+0.3);
  starColors[i3]=col.r; starColors[i3+1]=col.g; starColors[i3+2]=col.b;
  starSizes[i]=THREE.MathUtils.randFloat(0.6,3.0);
  starTwinkle[i]=Math.random()*Math.PI*2;
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions,3));
starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors,3));
starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes,1));
starGeometry.setAttribute('twinkle', new THREE.BufferAttribute(starTwinkle,1));
const starMaterial = new THREE.ShaderMaterial({
  uniforms:{uTime:{value:0},uPixelRatio:{value:renderer.getPixelRatio()}},
  vertexShader:`uniform float uTime; uniform float uPixelRatio; attribute float size; attribute float twinkle; varying vec3 vColor; varying float vTwinkle; void main(){vColor=color; vTwinkle=sin(uTime*2.5+twinkle)*0.5+0.5; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=size*uPixelRatio*(300.0/-mv.z); gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`varying vec3 vColor; varying float vTwinkle; void main(){float d=distance(gl_PointCoord,vec2(0.5)); if(d>0.5) discard; float a=(1.0-smoothstep(0.0,0.5,d))*(0.2+vTwinkle*0.8); gl_FragColor=vec4(vColor,a);}`,
  transparent:true, vertexColors:true, blending:THREE.AdditiveBlending, depthWrite:false
});
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Event horizon glow
const eventHorizon = new THREE.Mesh(
  new THREE.SphereGeometry(BLACK_HOLE_RADIUS*1.05,128,64),
  new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0},uCameraPosition:{value:camera.position}},
    vertexShader:`varying vec3 vN; varying vec3 vP; void main(){vN=normalize(normalMatrix*normal); vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`uniform float uTime; uniform vec3 uCameraPosition; varying vec3 vN; varying vec3 vP; void main(){float f=pow(1.0-abs(dot(vN,normalize(uCameraPosition-vP))),2.5); vec3 c=vec3(1.0,0.4,0.1)*(sin(uTime*2.5)*0.15+0.85); gl_FragColor=vec4(c*f,f*0.4);}`,
    transparent:true, blending:THREE.AdditiveBlending, side:THREE.BackSide
  })
);
scene.add(eventHorizon);

// Black hole (solid disc)
const blackHoleMesh = new THREE.Mesh(new THREE.SphereGeometry(BLACK_HOLE_RADIUS,128,64), new THREE.MeshBasicMaterial({color:0x000000}));
blackHoleMesh.renderOrder = 0;
scene.add(blackHoleMesh);

// Accretion disk – heavy shader, kept verbatim for fidelity
const diskGeometry = new THREE.RingGeometry(DISK_INNER_RADIUS, DISK_OUTER_RADIUS, 256, 128);
const diskMaterial = new THREE.ShaderMaterial({
  uniforms:{
    uTime:{value:0.0},uColorHot:{value:new THREE.Color(0xffffff)},uColorMid1:{value:new THREE.Color(0xff7733)},uColorMid2:{value:new THREE.Color(0xff4477)},uColorMid3:{value:new THREE.Color(0x7744ff)},uColorOuter:{value:new THREE.Color(0x4477ff)},uNoiseScale:{value:2.5},uFlowSpeed:{value:0.22},uDensity:{value:1.3}
  },
  vertexShader:`varying vec2 vUv; varying float vR; varying float vA; void main(){vUv=uv; vR=length(position.xy); vA=atan(position.y,position.x); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`
            uniform float uTime;
            uniform vec3 uColorHot;
            uniform vec3 uColorMid1;
            uniform vec3 uColorMid2;
            uniform vec3 uColorMid3;
            uniform vec3 uColorOuter;
            uniform float uNoiseScale;
            uniform float uFlowSpeed;
            uniform float uDensity;

            varying vec2 vUv;
            varying float vR;
            varying float vA;

            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

            float snoise(vec3 v) {
                const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                vec3 i  = floor(v + dot(v, C.yyy) );
                vec3 x0 = v - i + dot(i, C.xxx) ;
                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min( g.xyz, l.zxy );
                vec3 i2 = max( g.xyz, l.zxy );
                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;
                i = mod289(i);
                vec4 p = permute( permute( permute(
                         i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                       + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                       + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                float n_ = 0.142857142857;
                vec3  ns = n_ * D.wyz - D.xzx;
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_ );
                vec4 x = x_ *ns.x + ns.yyyy;
                vec4 y = y_ *ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);
                vec4 b0 = vec4( x.xy, y.xy );
                vec4 b1 = vec4( x.zw, y.zw );
                vec4 s0 = floor(b0)*2.0 + 1.0;
                vec4 s1 = floor(b1)*2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));
                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
                vec3 p0 = vec3(a0.xy,h.x);
                vec3 p1 = vec3(a0.zw,h.y);
                vec3 p2 = vec3(a1.xy,h.z);
                vec3 p3 = vec3(a1.zw,h.w);
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
            }

            void main() {
                float normalizedRadius = smoothstep(${DISK_INNER_RADIUS.toFixed(2)}, ${DISK_OUTER_RADIUS.toFixed(2)}, vR);

                float spiral = vA * 3.0 - (1.0 / (normalizedRadius + 0.1)) * 2.0;
                vec2 noiseUv = vec2(vUv.x + uTime * uFlowSpeed * (2.0 / (vR * 0.3 + 1.0)) + sin(spiral) * 0.1, vUv.y * 0.8 + cos(spiral) * 0.1);
                float noiseVal1 = snoise(vec3(noiseUv * uNoiseScale, uTime * 0.15));
                float noiseVal2 = snoise(vec3(noiseUv * uNoiseScale * 3.0 + 0.8, uTime * 0.22));
                float noiseVal3 = snoise(vec3(noiseUv * uNoiseScale * 6.0 + 1.5, uTime * 0.3));

                float noiseVal = (noiseVal1 * 0.45 + noiseVal2 * 0.35 + noiseVal3 * 0.2);
                noiseVal = (noiseVal + 1.0) * 0.5;

                vec3 color = uColorOuter;
                color = mix(color, uColorMid3, smoothstep(0.0, 0.25, normalizedRadius));
                color = mix(color, uColorMid2, smoothstep(0.2, 0.55, normalizedRadius));
                color = mix(color, uColorMid1, smoothstep(0.5, 0.75, normalizedRadius));
                color = mix(color, uColorHot, smoothstep(0.7, 0.95, normalizedRadius));

                color *= (0.5 + noiseVal * 1.0);
                float brightness = pow(1.0 - normalizedRadius, 1.0) * 3.5 + 0.5;
                brightness *= (0.3 + noiseVal * 2.2);

                float pulse = sin(uTime * 1.8 + normalizedRadius * 12.0 + vA * 2.0) * 0.15 + 0.85;
                brightness *= pulse;

                float alpha = uDensity * (0.2 + noiseVal * 0.9);
                alpha *= smoothstep(0.0, 0.15, normalizedRadius);
                alpha *= (1.0 - smoothstep(0.85, 1.0, normalizedRadius));
                alpha = clamp(alpha, 0.0, 1.0);

                gl_FragColor = vec4(color * brightness, alpha);
            }
        `,
  transparent:true, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending
});
const accretionDisk = new THREE.Mesh(diskGeometry, diskMaterial);
accretionDisk.rotation.x = DISK_TILT_ANGLE;
accretionDisk.renderOrder = 1;
scene.add(accretionDisk);

// Fade out #info panel after a few seconds
setTimeout(()=>{const info=document.getElementById('info'); if(info) info.style.opacity='0';},5000);

// Resize handler
let resizeTimeout; window.addEventListener('resize',()=>{
  clearTimeout(resizeTimeout);
  resizeTimeout=setTimeout(()=>{
    camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight); composer.setSize(window.innerWidth, window.innerHeight);
    bloomPass.resolution.set(window.innerWidth, window.innerHeight);
    lensingPass.uniforms.aspectRatio.value = window.innerWidth/window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
  },150);
});

// Animation loop
const clock = new THREE.Clock();
const bhScreenPos = new THREE.Vector3();
function animate(){
  requestAnimationFrame(animate);
  const et = clock.getElapsedTime();
  const dt = clock.getDelta();
  diskMaterial.uniforms.uTime.value = et;
  starMaterial.uniforms.uTime.value = et;
  eventHorizon.material.uniforms.uTime.value = et;
  bhScreenPos.copy(blackHoleMesh.position).project(camera);
  lensingPass.uniforms.blackHoleScreenPos.value.set((bhScreenPos.x+1)/2,(bhScreenPos.y+1)/2);
  controls.update(); stars.rotation.y += dt*0.003; stars.rotation.x += dt*0.001; accretionDisk.rotation.z += dt*0.005;
  composer.render(dt);
}
animate();
