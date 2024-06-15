import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(22, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(140, 30, 60);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 10;
controls.maxDistance = 60;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.5;
controls.autoRotate = false;
controls.target = new THREE.Vector3(0, 1, 0);
controls.update();

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(0, 25, 0);
spotLight.castShadow = true;
spotLight.shadow.bias = -0.0001;
scene.add(spotLight);

const vertexShader = `
uniform float time;
uniform vec2 mouse;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 transformed = position + normal * sin(distance(mouse, position.xy) * 10.0 - time * 5.0) * 0.2;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
uniform sampler2D baseTexture;

void main() {
  gl_FragColor = texture2D(baseTexture, vUv);
}
`;

const loader = new GLTFLoader().setPath('cow/');
loader.load('scene.gltf', (gltf) => {
  console.log('loading model');
  const mesh = gltf.scene;

  mesh.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      child.material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          time: { value: 0 },
          mouse: { value: new THREE.Vector2() },
          baseTexture: { value: child.material.map }
        }
      });
    }
  });

  mesh.position.set(0, -8, 0);
  scene.add(mesh);

  document.getElementById('progress-container').style.display = 'none';
}, (xhr) => {
  console.log(`loading ${xhr.loaded / xhr.total * 100}%`);
}, (error) => {
  console.error(error);
});

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let isMouseOverCow = false;
let prevMousePosition = new THREE.Vector2();
let mouseMoved = false;

window.addEventListener('mousemove', (event) => {
  const newMousePosition = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    - (event.clientY / window.innerHeight) * 2 + 1
  );

  mouseMoved = !newMousePosition.equals(prevMousePosition);
  prevMousePosition.copy(newMousePosition);

  mouse.x = newMousePosition.x;
  mouse.y = newMousePosition.y;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  isMouseOverCow = intersects.length > 0;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);

  // Update the time uniform for the shader only if the mouse is moving over the cow
  if (isMouseOverCow && mouseMoved) {
    scene.traverse((child) => {
      if (child.isMesh && child.material.uniforms) {
        child.material.uniforms.time.value += 0.05;
        child.material.uniforms.mouse.value = mouse;
      }
    });
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
