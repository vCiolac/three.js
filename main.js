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
camera.position.set(40, 10, 60);

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

const birdLoader = new GLTFLoader().setPath('bird/');
let mixer;

birdLoader.load('scene.gltf', (gltf) => {
  console.log('loading bird model');
  const bird = gltf.scene;
  scene.add(bird);

  bird.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  if (gltf.animations && gltf.animations.length) {
    mixer = new THREE.AnimationMixer(bird);
    gltf.animations.forEach((clip) => {
      mixer.clipAction(clip).play();
    });
  }

  bird.position.set(0, -6, 0);

  document.getElementById('progress-container').style.display = 'none';
}, (xhr) => {
  console.log(`loading bird ${xhr.loaded / xhr.total * 100}%`);
}, (error) => {
  console.error(error);
});

const backgroundLoader = new GLTFLoader().setPath('remains/');
backgroundLoader.load('scene.gltf', (gltf) => {
  console.log('loading background model');
  const background = gltf.scene;
  scene.add(background);

  background.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  background.scale.set(4, 4, 4);
  background.position.set(0, -7, -10);
  background.rotation.y = 180 * (Math.PI / 180);


}, (xhr) => {
  console.log(`loading background ${xhr.loaded / xhr.total * 100}%`);
}, (error) => {
  console.error(error);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);

  if (mixer) {
    mixer.update(0.01);  // Atualiza a animação
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
