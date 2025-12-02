import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let container;
let camera, scene, renderer;
let horseModel = null;

init();
animate();

function init() {
    container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // --- TRUCO: Sin 'requiredFeatures' ---
    // Al no pedir 'hit-test', muchos celulares saltan la comprobación estricta de ARCore
    // Usamos 'optionalFeatures' solo por si acaso
    document.body.appendChild(ARButton.createButton(renderer, { 
        optionalFeatures: ['dom-overlay'], 
        domOverlay: { root: document.body } 
    }));

    // Cargar Modelo
    const loader = new GLTFLoader();
    loader.load('Horse.glb', function (gltf) {
        horseModel = gltf.scene;
        // Escala ajustada
        horseModel.scale.set(0.002, 0.002, 0.002); 
        // Posición: 1.5 metros al frente y un poco abajo
        horseModel.position.set(0, -0.5, -1.5); 
        
        scene.add(horseModel); 
        console.log("Caballo añadido (Modo Flotante)");
    });

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    renderer.render(scene, camera);
}
