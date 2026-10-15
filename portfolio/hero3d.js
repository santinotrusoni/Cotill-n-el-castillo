import * as THREE from "three";

const canvas = document.getElementById("hero-canvas");
if (canvas && window.WebGLRenderingContext) {

  const hero = canvas.closest(".hero");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- ESCENA ----------
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, hero.clientWidth / hero.clientHeight, 0.1, 100);
  camera.position.set(0.3, 0.9, 7.5);
  camera.lookAt(2.2, 0.2, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(hero.clientWidth, hero.clientHeight);

  // ---------- LUCES ----------
  const ambient = new THREE.AmbientLight(0x2a1010, 1.3);
  scene.add(ambient);

  const keyLight = new THREE.PointLight(0xff3b3b, 45, 25, 2);
  keyLight.position.set(4, 3, 5);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0xffffff, 10, 25, 2);
  rimLight.position.set(-3, 1, -4);
  scene.add(rimLight);

  const groundBounce = new THREE.PointLight(0xff2e2e, 8, 10, 2);
  groundBounce.position.set(2, -1.5, 2);
  scene.add(groundBounce);

  // ---------- GRUPO AUTO (genérico, deportivo, sin marca) ----------
  const carGroup = new THREE.Group();
  carGroup.position.set(2.1, -0.15, 0);
  scene.add(carGroup);

  // --- Silueta lateral (perfil) construida a mano, estilo low-poly ---
  const profile = new THREE.Shape();
  profile.moveTo(-1.9, 0.12);
  profile.lineTo(-1.95, 0.42);
  profile.lineTo(-1.7, 0.55);
  profile.lineTo(-1.15, 0.62);
  profile.lineTo(-0.65, 0.92);
  profile.lineTo(-0.05, 0.98);
  profile.lineTo(0.55, 0.88);
  profile.lineTo(0.85, 0.58);
  profile.lineTo(1.25, 0.5);
  profile.lineTo(1.75, 0.38);
  profile.lineTo(1.92, 0.2);
  profile.lineTo(1.9, 0.08);
  profile.lineTo(1.6, 0.05);
  profile.lineTo(-1.6, 0.05);
  profile.lineTo(-1.9, 0.12);

  const CAR_WIDTH = 1.9;
  const extrudeSettings = {
    steps: 1,
    depth: CAR_WIDTH,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
  };
  const bodyGeo = new THREE.ExtrudeGeometry(profile, extrudeSettings);
  bodyGeo.translate(0, 0, -CAR_WIDTH / 2);
  bodyGeo.rotateY(Math.PI / 2);

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x120404,
    metalness: 0.75,
    roughness: 0.28,
    emissive: 0xff2e2e,
    emissiveIntensity: 0.12,
    clearcoat: 0.8,
    clearcoatRoughness: 0.25,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  carGroup.add(body);

  // Franja lateral (detalle de marca, look "GT stripe")
  const stripeGeo = new THREE.BoxGeometry(2.9, 0.06, 0.02);
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xff2e2e });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.set(0.05, 0.42, CAR_WIDTH / 2 + 0.01);
  carGroup.add(stripe);
  const stripeBack = stripe.clone();
  stripeBack.position.z = -CAR_WIDTH / 2 - 0.01;
  carGroup.add(stripeBack);

  // Vidrios
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1a1a,
    metalness: 0.2,
    roughness: 0.05,
    transmission: 0.6,
    transparent: true,
    opacity: 0.85,
  });
  const glassGeo = new THREE.BoxGeometry(1.55, 0.42, CAR_WIDTH - 0.15);
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.set(-0.3, 0.78, 0);
  glass.rotation.z = -0.05;
  carGroup.add(glass);

  // --- Ruedas ---
  function buildWheel() {
    const wheel = new THREE.Group();

    const tireGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 20);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9, metalness: 0.1 });
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.z = Math.PI / 2;
    wheel.add(tire);

    const rimGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.26, 6);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xff2e2e, roughness: 0.35, metalness: 0.8, emissive: 0x330000, emissiveIntensity: 0.3 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    wheel.add(rim);

    return wheel;
  }

  const wheelPositions = [
    [1.35, -0.18, CAR_WIDTH / 2 - 0.1],
    [1.35, -0.18, -CAR_WIDTH / 2 + 0.1],
    [-1.35, -0.18, CAR_WIDTH / 2 - 0.1],
    [-1.35, -0.18, -CAR_WIDTH / 2 + 0.1],
  ];
  wheelPositions.forEach((pos) => {
    const w = buildWheel();
    w.position.set(...pos);
    carGroup.add(w);
  });

  // Faros delanteros
  const headlightGeo = new THREE.SphereGeometry(0.07, 12, 12);
  const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2 });
  [1, -1].forEach((side) => {
    const h = new THREE.Mesh(headlightGeo, headlightMat);
    h.position.set(1.85, 0.3, side * (CAR_WIDTH / 2 - 0.35));
    carGroup.add(h);
  });

  // Luces traseras
  const taillightGeo = new THREE.BoxGeometry(0.05, 0.1, 0.35);
  const taillightMat = new THREE.MeshStandardMaterial({ color: 0xff2e2e, emissive: 0xff2e2e, emissiveIntensity: 2.2 });
  const taillight = new THREE.Mesh(taillightGeo, taillightMat);
  taillight.position.set(-1.9, 0.4, 0);
  carGroup.add(taillight);

  // Piso reflectante sutil
  const groundGeo = new THREE.CircleGeometry(2.6, 48);
  const groundMat = new THREE.MeshBasicMaterial({ color: 0xff2e2e, transparent: true, opacity: 0.05 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  carGroup.add(ground);

  // Halo atmosférico
  const haloGeo = new THREE.SphereGeometry(2.6, 32, 32);
  const haloMat = new THREE.ShaderMaterial({
    uniforms: { glowColor: { value: new THREE.Color(0xff2e2e) } },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      uniform vec3 glowColor;
      void main() {
        float intensity = pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
        gl_FragColor = vec4(glowColor, intensity * 0.35);
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.position.y = 0.3;
  carGroup.add(halo);

  // Partículas
  const particleCount = 90;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 6;
    particlePositions[i * 3 + 1] = Math.random() * 2.5 - 0.5;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 4;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  const particleMat = new THREE.PointsMaterial({ color: 0xff2e2e, size: 0.02, transparent: true, opacity: 0.4 });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ---------- INTERACCIÓN CON EL MOUSE ----------
  let targetRotY = -0.15;
  let targetTiltX = 0;
  window.addEventListener("mousemove", (e) => {
    targetRotY = -0.15 + (e.clientX / window.innerWidth - 0.5) * 0.5;
    targetTiltX = (e.clientY / window.innerHeight - 0.5) * 0.08;
  });

  // ---------- RESIZE ----------
  function onResize() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener("resize", onResize);

  // ---------- LOOP ----------
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    if (!prefersReducedMotion) {
      carGroup.rotation.y += (targetRotY - carGroup.rotation.y) * 0.04;
      carGroup.rotation.x += (targetTiltX - carGroup.rotation.x) * 0.04;
      carGroup.position.y = -0.15 + Math.sin(t * 0.7) * 0.05;
      particles.rotation.y = t * 0.02;
    }

    renderer.render(scene, camera);
  }

  let isVisible = true;
  const observer = new IntersectionObserver(
    (entries) => { isVisible = entries[0].isIntersecting; },
    { threshold: 0.05 }
  );
  observer.observe(hero);

  const originalRender = renderer.render.bind(renderer);
  renderer.render = (...args) => { if (isVisible) originalRender(...args); };

  animate();
}
