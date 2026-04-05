/**
 * Basic Three.js 3D animation setup
 * This script creates a rotating cube animation
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

let scene, camera, renderer, cube;

function init() {
  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  // Renderer
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  const container = document.getElementById('threejs-container');
  if (container) {
    container.appendChild(renderer.domElement);
  }

  // Cube geometry and material
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
  cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // Handle window resize
  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  // Rotate cube
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  renderer.render(scene, camera);
}

export function startAnimation() {
  init();
  animate();
}
