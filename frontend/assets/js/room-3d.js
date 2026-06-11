import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/FBXLoader.js';
import { observeReveal, renderShell } from './common.js?v=pages-path-1';

const ROOM_SCENES = {
  living: {
    label: 'Phòng khách',
    src: new URL('../3d/Living-room-Roomi.fbx', import.meta.url).href,
    targetSize: 5.8,
    cameraOffset: [0.72, 0.52, 0.9],
  },
  bedroom: {
    label: 'Phòng ngủ',
    src: new URL('../3d/Bedroom-Roomi.fbx', import.meta.url).href,
    targetSize: 5.4,
    cameraOffset: [0.76, 0.58, 0.94],
  },
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const transparentTexture =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';

renderShell(document.body.dataset.page || '');
observeReveal();
initRoomPreview();

function initRoomPreview() {
  const canvas = document.querySelector('[data-room3d-canvas]');
  const stage = document.querySelector('[data-room3d-stage]');
  const loading = document.querySelector('[data-room3d-loading]');
  const status = document.querySelector('[data-room3d-status]');

  window.__roomi3D = {
    ready: false,
    scene: null,
    meshCount: 0,
    error: null,
  };

  if (!canvas || !stage) {
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
  } catch (_error) {
    setLoadingState('Trình duyệt chưa hỗ trợ WebGL', true);
    return;
  }

  renderer.setClearColor(0xf0f0e8, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0e8);
  scene.fog = new THREE.Fog(0xf0f0e8, 9, 19);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 2.2;
  controls.maxDistance = 13;
  controls.maxPolarAngle = Math.PI * 0.62;
  controls.minPolarAngle = Math.PI * 0.12;
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 0.32;

  const loadingManager = new THREE.LoadingManager();
  loadingManager.setURLModifier((url) => {
    const normalizedUrl = decodeURIComponent(url || '').replace(/\\/g, '/').toLowerCase();

    if (
      normalizedUrl.endsWith('/undefined') ||
      (normalizedUrl.includes('/assets/3d/') && /\.(png|jpe?g|webp|gif|tga|bmp)$/i.test(normalizedUrl))
    ) {
      return transparentTexture;
    }

    return url;
  });

  const loader = new FBXLoader(loadingManager);
  const roomRoot = new THREE.Group();
  let currentRoom = null;
  let loadToken = 0;
  let defaultCameraPosition = new THREE.Vector3(5, 3.4, 6.2);
  let defaultTarget = new THREE.Vector3(0, 1.25, 0);

  scene.add(roomRoot);
  buildStudioShell(scene);
  addLights(scene);
  resize();
  bindControls();
  loadRoom('living');
  animate();

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  window.addEventListener('resize', resize);

  function addLights(targetScene) {
    const hemi = new THREE.HemisphereLight(0xfff8f1, 0x6c4d45, 1.2);
    targetScene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(4.8, 7.6, 5.6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 18;
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -6;
    targetScene.add(key);

    const fill = new THREE.DirectionalLight(0xffd9c5, 0.72);
    fill.position.set(-5.5, 4.4, -4.2);
    targetScene.add(fill);
  }

  function buildStudioShell(targetScene) {
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8ddd7,
      roughness: 0.72,
      metalness: 0.02,
    });
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xf3efea,
      roughness: 0.84,
      metalness: 0,
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    targetScene.add(floor);

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 6.4), wallMaterial);
    backWall.position.set(0, 3.2, -4.6);
    backWall.receiveShadow = true;
    targetScene.add(backWall);

    const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(9, 6.4), wallMaterial.clone());
    sideWall.rotation.y = -Math.PI / 2;
    sideWall.position.set(5.4, 3.2, -0.8);
    sideWall.receiveShadow = true;
    targetScene.add(sideWall);
  }

  function bindControls() {
    document.querySelectorAll('[data-room-scene]').forEach((button) => {
      button.addEventListener('click', () => loadRoom(button.dataset.roomScene));
    });

    document.querySelector('[data-room-control="spin"]')?.addEventListener('click', (event) => {
      controls.autoRotate = !controls.autoRotate;
      event.currentTarget.classList.toggle('is-active', controls.autoRotate);
    });

    document.querySelector('[data-room-control="zoom-in"]')?.addEventListener('click', () => zoomCamera(0.82));
    document.querySelector('[data-room-control="zoom-out"]')?.addEventListener('click', () => zoomCamera(1.18));
    document.querySelector('[data-room-control="reset"]')?.addEventListener('click', () => resetCamera());

    stage.addEventListener('pointerdown', () => {
      controls.autoRotate = false;
      document.querySelector('[data-room-control="spin"]')?.classList.remove('is-active');
    });
  }

  function loadRoom(sceneId) {
    const roomConfig = ROOM_SCENES[sceneId] || ROOM_SCENES.living;
    const token = ++loadToken;
    setActiveScene(sceneId);
    window.__roomi3D = {
      ready: false,
      scene: sceneId,
      meshCount: 0,
      error: null,
    };
    setLoadingState(`Đang tải ${roomConfig.label.toLowerCase()}...`);
    stage.classList.add('is-loading');

    loader.load(
      roomConfig.src,
      (fbx) => {
        if (token !== loadToken) {
          disposeObject(fbx);
          return;
        }

        if (currentRoom) {
          roomRoot.remove(currentRoom);
          disposeObject(currentRoom);
        }

        prepareModel(fbx);
        frameModel(fbx, roomConfig);
        const meshCount = countMeshes(fbx);
        roomRoot.add(fbx);
        currentRoom = fbx;

        window.__roomi3D = {
          ready: true,
          scene: sceneId,
          meshCount,
          error: null,
        };

        if (status) {
          status.textContent = roomConfig.label;
        }

        resetCamera(false);
        setLoadingState('', false, true);
        stage.classList.remove('is-loading');
      },
      (event) => {
        if (!event.total) {
          return;
        }
        const progress = Math.min(99, Math.round((event.loaded / event.total) * 100));
        setLoadingState(`Đang tải ${roomConfig.label.toLowerCase()} ${progress}%...`);
      },
      () => {
        window.__roomi3D = {
          ready: false,
          scene: sceneId,
          meshCount: 0,
          error: 'load-failed',
        };
        setLoadingState('Không tải được model 3D', true);
        stage.classList.remove('is-loading');
      },
    );
  }

  function prepareModel(object) {
    object.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      child.castShadow = true;
      child.receiveShadow = true;
      child.frustumCulled = false;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.filter(Boolean).forEach((material) => {
        if (material.map) {
          material.map.colorSpace = THREE.SRGBColorSpace;
        }
        material.needsUpdate = true;
      });
    });
  }

  function countMeshes(object) {
    let meshCount = 0;
    object.traverse((child) => {
      if (child.isMesh) {
        meshCount += 1;
      }
    });
    return meshCount;
  }

  function frameModel(object, roomConfig) {
    object.updateMatrixWorld(true);
    const initialBox = new THREE.Box3().setFromObject(object);
    const initialSize = initialBox.getSize(new THREE.Vector3());
    const maxInitialSide = Math.max(initialSize.x, initialSize.y, initialSize.z) || 1;
    const scale = roomConfig.targetSize / maxInitialSide;

    object.scale.multiplyScalar(scale);
    object.updateMatrixWorld(true);

    const fittedBox = new THREE.Box3().setFromObject(object);
    const center = fittedBox.getCenter(new THREE.Vector3());
    object.position.x -= center.x;
    object.position.z -= center.z;
    object.position.y -= fittedBox.min.y;
    object.updateMatrixWorld(true);

    const finalBox = new THREE.Box3().setFromObject(object);
    const finalSize = finalBox.getSize(new THREE.Vector3());
    const height = Math.max(finalSize.y, 1.4);
    const span = Math.max(finalSize.x, finalSize.z, 4.2);
    const offset = roomConfig.cameraOffset;

    defaultTarget = new THREE.Vector3(0, Math.min(height * 0.48, 1.9), 0);
    defaultCameraPosition = new THREE.Vector3(span * offset[0], height * offset[1] + 1.2, span * offset[2]);
  }

  function resetCamera(animateReset = true) {
    if (!animateReset) {
      camera.position.copy(defaultCameraPosition);
      controls.target.copy(defaultTarget);
      controls.update();
      return;
    }

    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const startedAt = performance.now();
    const duration = 520;

    function step(now) {
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(startPosition, defaultCameraPosition, eased);
      controls.target.lerpVectors(startTarget, defaultTarget, eased);
      controls.update();

      if (t < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  function zoomCamera(multiplier) {
    const direction = camera.position.clone().sub(controls.target);
    const nextDistance = THREE.MathUtils.clamp(
      direction.length() * multiplier,
      controls.minDistance,
      controls.maxDistance,
    );
    camera.position.copy(controls.target.clone().add(direction.setLength(nextDistance)));
    controls.update();
  }

  function setActiveScene(sceneId) {
    document.querySelectorAll('[data-room-scene]').forEach((button) => {
      const isActive = button.dataset.roomScene === sceneId;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    });
  }

  function setLoadingState(message, isError = false, hide = false) {
    if (!loading) {
      return;
    }

    loading.hidden = hide;
    loading.classList.toggle('is-error', isError);
    const text = loading.querySelector('strong');
    if (text && message) {
      text.textContent = message;
    }
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(360, Math.floor(rect.height));

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
}

function disposeObject(object) {
  object.traverse?.((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.filter(Boolean).forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value?.isTexture) {
          value.dispose();
        }
      });
      material.dispose();
    });
  });
}
