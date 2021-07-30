import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { DotScreenPass } from 'three/examples/jsm/postprocessing/DotScreenPass.js'
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js'
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js'
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js'

import tintPassVertexShader from './shaders/tintPass/vertex.glsl' 
import tintPassFragmentShader from './shaders/tintPass/fragment.glsl' 
import displacementPassVertexShader from './shaders/displacementPass/vertex.glsl' 
import displacementPassFragmentShader from './shaders/displacementPass/fragment.glsl' 

import * as dat from 'dat.gui'
import {gsap} from 'gsap'
// import CSSPlugin from 'gsap/CSSPlugin';

/**
 * Base
 */
// Debug
const gui = new dat.GUI()
gui.close()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
//grab dom elements
const loadingBar =  document.querySelector('.loading-bar')
const loadingBalls = document.querySelector('.wrapper')

console.log(window.getComputedStyle(loadingBalls).getPropertyValue("opacity"));
const loadingManager = new THREE.LoadingManager(
    ()=>{
        setTimeout(()=>{
            displacementPass.enabled = true
            gsap.to(overlayMaterial.uniforms.uAlpha,{duration: 3, value: 0})
            loadingBar.classList.add('ended')
            loadingBar.style.transform = ``

            gsap.to('.wrapper',{ duration: 2, autoAlpha: 0} )
        },500)

    },
    (url, itemsLoaded, itemsTotal)=>{
        let loadingRate = itemsLoaded / itemsTotal
        loadingBar.style.transform = `scaleX(${loadingRate})`
    }
)
const gltfLoader = new GLTFLoader(loadingManager)
const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager)
const textureLoader = new THREE.TextureLoader(loadingManager)

/**
 * Overlay mesh
 */
 const overlayGeography = new THREE.PlaneBufferGeometry(2, 2, 1, 1)
 const overlayMaterial = new THREE.ShaderMaterial({
     transparent : true,
     uniforms: {
         uAlpha: { value : 1.0 }
     },
     vertexShader: `
         void main(){
             //position
             gl_Position = vec4(position, 1.0);

             //color

         }
     `,
     fragmentShader:`
         uniform float uAlpha;
         
         void main(){
             gl_FragColor = vec4(0.15, 0.15, 0.15, uAlpha);
         }
     `
 })
 const overlayPlane = new THREE.Mesh(overlayGeography, overlayMaterial)
 scene.add(overlayPlane) 
 
 
/**
 * Update all materials
 */
const updateAllMaterials = () =>
{
    scene.traverse((child) =>
    {
        if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial)
        {
            child.material.envMapIntensity = 5
            child.material.needsUpdate = true
            child.castShadow = true
            child.receiveShadow = true
        }
    })
}

/**
 * Environment map
 */
const environmentMap = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.jpg',
    '/textures/environmentMaps/0/nx.jpg',
    '/textures/environmentMaps/0/py.jpg',
    '/textures/environmentMaps/0/ny.jpg',
    '/textures/environmentMaps/0/pz.jpg',
    '/textures/environmentMaps/0/nz.jpg'
])
environmentMap.encoding = THREE.sRGBEncoding

scene.background = environmentMap
scene.environment = environmentMap

/**
 * Models
 */
gltfLoader.load(
    '/models/DamagedHelmet/glTF/DamagedHelmet.gltf',
    (gltf) =>
    {
        gltf.scene.scale.set(2, 2, 2)
        gltf.scene.rotation.y = Math.PI * 0.5
        scene.add(gltf.scene)

        updateAllMaterials()
    }
)

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(0.25, 3, - 2.25)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    //update effectComposer
    effectComposer.setSize(sizes.width, sizes.height)
    effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(4, 1, - 4)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enablePan = false
controls.minDistance = 5
controls.maxDistance = 7

gui.add(controls, 'minDistance').min(0).max(2000).step(0.001).name("minZoom")
gui.add(controls, 'maxDistance').min(0).max(2000).step(0.001).name("maxZoom")

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.physicallyCorrectLights = true
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMappingExposure = 1.5
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Post Processing 
 */
//render Target
let RenderTargetClass = null

if(renderer.getPixelRatio() === 1 && renderer.capabilities.isWebGL2){
    RenderTargetClass = THREE.WebGLMultisampleRenderTarget
    console.log("Using WebGLMultisampleRenderTarget");
}
else{
    RenderTargetClass = THREE.WebGLRenderTarget
    console.log("Using WebGLRenderTarget");
}


const renderTarget = new RenderTargetClass(
    800,
    600,
    {
        minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format:THREE.RGBAFormat ,
        encoding : THREE.sRGBEncoding
    }
)

//EffectComposer
const effectComposer = new EffectComposer(renderer, renderTarget)
effectComposer.setSize(sizes.width, sizes.height)
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

//Passes
//renderpass
const renderPass = new RenderPass(scene, camera)
effectComposer.addPass(renderPass)

//dotscreenpass
const dotScreenPass = new DotScreenPass()
dotScreenPass.enabled = false
effectComposer.addPass(dotScreenPass)

const dotScreenFolder = gui.addFolder('DotScreenPass')
dotScreenFolder.add(dotScreenPass, 'enabled')

//glitchPass
const glitchPass = new GlitchPass()
glitchPass.enabled = false
glitchPass.goWild = false
effectComposer.addPass(glitchPass)

const glitchPassFolder = gui.addFolder('Glitch Effect')
glitchPassFolder.add(glitchPass, 'enabled')
glitchPassFolder.add(glitchPass,'goWild')


//rgbshiftpass
const rgbShiftPass = new ShaderPass(RGBShiftShader)
rgbShiftPass.enabled = false
effectComposer.addPass(rgbShiftPass)

const rgbShiftPassFolder = gui.addFolder('RGB shift Effect')
rgbShiftPassFolder.add(rgbShiftPass, 'enabled')

//unrealbloompass
const unrealBloomPass = new UnrealBloomPass()
effectComposer.addPass(unrealBloomPass)
unrealBloomPass.strength = 0.2
unrealBloomPass.radius = 1
unrealBloomPass.threshold = 0.6
unrealBloomPass.enabled = false

const unrealBloomFolder = gui.addFolder('UnrealBloomPass')
unrealBloomFolder.add(unrealBloomPass, 'enabled')
unrealBloomFolder.add(unrealBloomPass, 'strength').min(0).max(2).step(0.001)
unrealBloomFolder.add(unrealBloomPass, 'radius').min(0).max(2).step(0.001)
unrealBloomFolder.add(unrealBloomPass, 'threshold').min(0).max(1).step(0.001)

/**
 * custom passes
 */
//tint pass
const TintShader = {
    uniforms : { 
        tDiffuse: { value: null },
        uTint: { value : null }
    },
    vertexShader : tintPassVertexShader,
    fragmentShader : tintPassFragmentShader
}
const tintPass = new ShaderPass(TintShader)
tintPass.material.uniforms.uTint.value = new THREE.Vector3()
tintPass.enabled = false
effectComposer.addPass(tintPass)

const tintPassFolder = gui.addFolder('TintPass')
tintPassFolder.add(tintPass, 'enabled')
tintPassFolder.add(tintPass.material.uniforms.uTint.value, 'x').min(0).max(1).step(0.001).name("Tint red color")
tintPassFolder.add(tintPass.material.uniforms.uTint.value, 'y').min(0).max(1).step(0.001).name("Tint green color")
tintPassFolder.add(tintPass.material.uniforms.uTint.value, 'z').min(0).max(1).step(0.001).name("Tint blue color")

//displacement pass
const DisplacementShader = {
    uniforms : { 
        tDiffuse: { value: null },
        uNormalMap: { value: null }
    },
    vertexShader : displacementPassVertexShader,
    fragmentShader : displacementPassFragmentShader
}
const displacementPass = new ShaderPass(DisplacementShader)
displacementPass.material.uniforms.uNormalMap.value = textureLoader.load('textures/interfaceNormalMap.png')
displacementPass.enabled = false
effectComposer.addPass(displacementPass)

const displacementPassFolder = gui.addFolder("Alien's viewport effect")
displacementPassFolder.add(displacementPass, 'enabled')

//bloom pass
const bloomPass = new BloomPass(   
    1,    // strength
    25,   // kernel size
    1,    // sigma ?
    256  // blur render target resolution
)
bloomPass.enabled = false
effectComposer.addPass(bloomPass)

const bloomPassFolder = gui.addFolder('BloomPass')
bloomPassFolder.add(bloomPass, 'enabled')
bloomPassFolder.add(bloomPass.copyUniforms.opacity, 'value', 0, 2).name('strength');

//filmpass
const filmPass = new FilmPass(
    0.35,   // noise intensity
    0.025,  // scanline intensity
    648,    // scanline count
    false,  // grayscale
);
filmPass.renderToScreen = true;
filmPass.enabled = false
effectComposer.addPass(filmPass);

const filmPassFolder = gui.addFolder('filmPass')
filmPassFolder.add(filmPass, 'enabled')

//smaa pass
if(renderer.getPixelRatio() === 1 && !renderer.capabilities.isWebGL2 ){
    const smaaPass = new SMAAPass()
    smaaPass.enabled = true
    effectComposer.addPass(smaaPass)
    console.log("Using WebGLRenderTarget and SMAAPass");
}

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Render
    // renderer.render(scene, camera)
    effectComposer.render()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()