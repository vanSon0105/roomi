import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/FBXLoader.js';
import { apiFetch, escapeHtml, observeReveal, pageHref, renderShell } from './common.js?v=pages-path-1';
import { formatCurrency } from './data.js';

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
const PAYMENT_POLL_LIMIT_MS = 2 * 60 * 1000;
let paymentPollTimer = null;

renderShell(document.body.dataset.page || '');
observeReveal();
bootstrapRoomPreview();

const viewerMarkup = () => `
  <section class="room3d-experience" aria-label="Mô phỏng không gian 3D ROOMI">
    <div class="room3d-stage" data-room3d-stage>
      <canvas class="room3d-canvas" data-room3d-canvas aria-label="Mô phỏng không gian ROOMI"></canvas>

      <div class="room3d-loading" data-room3d-loading>
        <span></span>
        <strong>Đang tải mô phỏng 3D</strong>
      </div>

      <div class="room3d-toolbar" aria-label="Điều khiển mô phỏng">
        <div class="room3d-scene-tabs" role="tablist" aria-label="Chọn không gian">
          <button class="is-active" type="button" data-room-scene="living" role="tab" aria-selected="true">Phòng khách</button>
          <button type="button" data-room-scene="bedroom" role="tab" aria-selected="false">Phòng ngủ</button>
        </div>

        <div class="room3d-controls" aria-label="Điều khiển camera">
          <button class="is-active" type="button" data-room-control="spin" aria-label="Tự xoay" title="Tự xoay">
            <i class="ph ph-arrows-clockwise" aria-hidden="true"></i>
          </button>
          <button type="button" data-room-control="zoom-in" aria-label="Phóng to" title="Phóng to">
            <i class="ph ph-magnifying-glass-plus" aria-hidden="true"></i>
          </button>
          <button type="button" data-room-control="zoom-out" aria-label="Thu nhỏ" title="Thu nhỏ">
            <i class="ph ph-magnifying-glass-minus" aria-hidden="true"></i>
          </button>
          <button type="button" data-room-control="reset" aria-label="Đặt lại góc nhìn" title="Đặt lại góc nhìn">
            <i class="ph ph-clock-counter-clockwise" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <p class="room3d-status" data-room3d-status>Phòng khách</p>
    </div>
  </section>
`;

async function bootstrapRoomPreview() {
  // If returning from PayOS with cancellation, cancel the order server-side
  if (hasCancelledPayos()) {
    try { await apiFetch('/room3d/cancel', { method: 'POST', body: JSON.stringify({}) }); } catch (_) {}
  }

  const loadingText = document.querySelector('[data-room3d-loading] strong');
  if (loadingText) {
    loadingText.textContent = 'Đang kiểm tra quyền xem 3D';
  }

  try {
    const response = await apiFetch('/room3d/access');
    const access = response.data;

    if (access?.hasAccess) {
      initRoomPreview();
      return;
    }

    renderPaywall(access);
  } catch (error) {
    renderPaywallError(error);
  }
}

function renderPaywallError(error) {
  const main = document.querySelector('.room3d-main');
  if (!main) return;

  main.innerHTML = `
    <section class="room3d-paywall">
      <div class="room3d-paywall-card">
        <p class="section-kicker">ROOMI 3D</p>
        <h1>Không tải được quyền xem</h1>
        <p>${escapeHtml(error.message || 'Vui lòng thử lại sau.')}</p>
        <a class="btn btn-outline" href="${pageHref('products.html')}">Quay lại mua sắm</a>
      </div>
    </section>
  `;
}

function isPayosOrder(order) {
  return order?.payment?.provider === 'PAYOS' || order?.paymentMethod === 'PAYOS';
}

function hasReturnedFromPayos() {
  const query = new URLSearchParams(window.location.search);
  return query.get('provider') === 'payos' || query.has('payment');
}

function hasCancelledPayos() {
  const query = new URLSearchParams(window.location.search);
  return query.get('provider') === 'payos' && query.get('payment') === 'cancelled';
}

function renderPayosPending(order, { autoRedirect = false } = {}) {
  clearPaymentPoll();
  const main = document.querySelector('.room3d-main');
  if (!main) return;

  const checkoutUrl = order?.payment?.checkoutUrl || '';

  // If just returned from PayOS with cancellation
  if (hasCancelledPayos()) {
    main.innerHTML = `
      <section class="room3d-paywall">
        <div class="room3d-paywall-card">
          <p class="section-kicker">ROOMI 3D</p>
          <h1>Thanh toán đã hủy</h1>
          <p>Bạn đã hủy thanh toán. Nhấn nút bên dưới để tạo đơn mới.</p>
          <button class="btn btn-maroon" type="button" data-room3d-buy>Mở khóa ngay</button>
        </div>
      </section>
    `;
    return;
  }

  main.innerHTML = `
    <section class="room3d-paywall">
      <div class="room3d-paywall-card">
        <p class="section-kicker">ROOMI 3D</p>
        <h1>${autoRedirect ? 'Đang chuyển sang trang thanh toán' : 'Đang kiểm tra thanh toán'}</h1>
        <p>${autoRedirect ? 'ROOMI đang mở trang thanh toán cho bạn.' : 'Nếu bạn chưa hoàn tất thanh toán, có thể tiếp tục.'}</p>
        <strong class="room3d-price">${formatCurrency(order?.total || order?.payment?.amount || 0)}</strong>
        ${checkoutUrl && !autoRedirect ? `<a class="btn btn-maroon" href="${escapeHtml(checkoutUrl)}">Tiếp tục thanh toán</a>` : ''}
        <p class="room3d-paywall-note" data-room3d-payment-status>Trang sẽ tự mở khóa sau khi Roomi xác nhận thanh toán.</p>
      </div>
    </section>
  `;

  pollRoom3DOrder(order.code);

  if (autoRedirect && checkoutUrl) {
    window.location.href = checkoutUrl;
  }
}

function renderPaywall(access = {}) {
  clearPaymentPoll();
  const main = document.querySelector('.room3d-main');
  if (!main) return;

  const order = access.pendingOrder;

  if (isPayosOrder(order)) {
    renderPayosPending(order, { autoRedirect: false });
    return;
  }

  main.innerHTML = `
    <section class="room3d-paywall">
      <div class="room3d-paywall-card">
        <p class="section-kicker">ROOMI 3D</p>
        <h1>Mở khóa mô phỏng 3D</h1>
        <p>Thanh toán một lần để xem và xoay không gian 3D của ROOMI.</p>
        <strong class="room3d-price">${formatCurrency(access.price || 0)}</strong>
        ${
          order
            ? renderRoom3DPaymentV2(order)
            : '<button class="btn btn-maroon" type="button" data-room3d-buy>Mở khóa ngay</button>'
        }
        <p class="room3d-paywall-note" data-room3d-note></p>
      </div>
    </section>
  `;

  if (order) {
    pollRoom3DOrder(order.code);
  }
}

function renderRoom3DPayment(order) {
  const payment = order.payment || {};
  const qrMarkup = payment.qrUrl
    ? `<img class="room3d-qr" src="${escapeHtml(payment.qrUrl)}" alt="QR thanh toán mở khóa 3D">`
    : '<div class="room3d-qr-missing">Chưa cấu hình QR nhận tiền.</div>';

  return `
    <div class="room3d-payment">
      ${qrMarkup}
      <div class="room3d-payment-info">
        <span>Mã đơn</span>
        <strong>${escapeHtml(order.code)}</strong>
        <span>Số tiền</span>
        <strong>${formatCurrency(order.total || payment.amount || 0)}</strong>
        <span>Nội dung chuyển khoản</span>
        <strong>${escapeHtml(payment.transferContent || order.code)}</strong>
        <p data-room3d-payment-status>Trang sẽ tự mở khóa sau khi thanh toán được xác nhận.</p>
      </div>
    </div>
  `;
}

function renderRoom3DPaymentV2(order) {
  const payment = order.payment || {};
  const isPayos = payment.provider === 'PAYOS';
  const payosQrImage = isPayos && /^(https?:|data:image)/.test(payment.qrCode || '') ? payment.qrCode : '';
  const transferLabel = isPayos ? 'Mã thanh toán' : 'Nội dung chuyển khoản';
  const transferValue = payment.transferContent || order.code;

  const qrMarkup = payment.qrUrl
    ? `<img class="room3d-qr" src="${escapeHtml(payment.qrUrl)}" alt="QR thanh toán mở khóa 3D">`
    : payosQrImage
      ? `<img class="room3d-qr" src="${escapeHtml(payosQrImage)}" alt="QR payOS mở khóa 3D">`
      : isPayos && payment.checkoutUrl
        ? `
          <div class="room3d-qr-missing room3d-payos-card">
            <strong>Thanh toán qua payOS</strong>
            <p>payOS sẽ hiển thị mã QR tự động ở trang thanh toán.</p>
            <a class="btn btn-maroon" href="${escapeHtml(payment.checkoutUrl)}">Mở QR payOS</a>
          </div>
        `
        : '<div class="room3d-qr-missing">Chưa cấu hình QR nhận tiền.</div>';

  return `
    <div class="room3d-payment">
      ${qrMarkup}
      <div class="room3d-payment-info">
        <span>Mã đơn</span>
        <strong>${escapeHtml(order.code)}</strong>
        <span>Số tiền</span>
        <strong>${formatCurrency(order.total || payment.amount || 0)}</strong>
        <span>${transferLabel}</span>
        <strong>${escapeHtml(transferValue)}</strong>
        ${
          isPayos && payment.checkoutUrl
            ? `<a class="btn btn-outline room3d-payment-link" href="${escapeHtml(payment.checkoutUrl)}">Tiếp tục thanh toán payOS</a>`
            : ''
        }
        <p data-room3d-payment-status>Trang sẽ tự mở khóa sau khi thanh toán được xác nhận.</p>
      </div>
    </div>
  `;
}

function clearPaymentPoll() {
  if (paymentPollTimer) {
    window.clearTimeout(paymentPollTimer);
    paymentPollTimer = null;
  }
}

window.addEventListener('pagehide', clearPaymentPoll);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearPaymentPoll();
  }
});

function unlockViewer() {
  clearPaymentPoll();
  const main = document.querySelector('.room3d-main');
  if (!main) return;

  main.innerHTML = viewerMarkup();
  initRoomPreview();
}

function pollRoom3DOrder(code, attempt = 0, startedAt = Date.now()) {
  clearPaymentPoll();

  if (!code || Date.now() - startedAt >= PAYMENT_POLL_LIMIT_MS) {
    const status = document.querySelector('[data-room3d-payment-status]');
    if (status) {
      status.textContent = 'Đã dừng tự động kiểm tra sau 2 phút. Bạn có thể tải lại trang nếu đã thanh toán.';
    }
    return;
  }

  paymentPollTimer = window.setTimeout(async () => {
    try {
      const response = await apiFetch(`/orders/${encodeURIComponent(code)}`);
      const order = response.data;
      const status = document.querySelector('[data-room3d-payment-status]');

      if (order.paymentStatus === 'PAID') {
        if (status) status.textContent = 'Đã thanh toán. Đang mở khóa mô phỏng 3D...';
        unlockViewer();
        return;
      }

      if (status && attempt >= 4) {
        status.textContent = 'Đang chờ ngân hàng xác nhận giao dịch...';
      }
    } catch (_error) {
      // Keep polling; transient network issues should not trap the user.
    }

    pollRoom3DOrder(code, attempt + 1, startedAt);
  }, Math.min(attempt < 2 ? 2000 : 4000, PAYMENT_POLL_LIMIT_MS - (Date.now() - startedAt)));
}

document.addEventListener('click', async (event) => {
  const buyButton = event.target.closest('[data-room3d-buy]');
  if (!buyButton) return;

  buyButton.disabled = true;
  buyButton.textContent = 'Đang tạo mã thanh toán...';
  const note = document.querySelector('[data-room3d-note]');
  if (note) note.textContent = '';

  try {
    const response = await apiFetch('/room3d/orders', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const access = response.data;

    if (access?.hasAccess) {
      unlockViewer();
      return;
    }

    if (isPayosOrder(access?.pendingOrder)) {
      renderPayosPending(access.pendingOrder, { autoRedirect: true });
      return;
    }

    renderPaywall(access);
  } catch (error) {
    buyButton.disabled = false;
    buyButton.textContent = 'Mở khóa ngay';
    if (note) note.textContent = error.message || 'Không tạo được mã thanh toán.';
  }
});

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
