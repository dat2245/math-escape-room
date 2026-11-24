const Room3D = (() => {
  let scene, camera, renderer, raycaster, mouse;
  let roomGroup, outdoorGroup, ceilingLampGroup, ceilingPointLight;
  let floorMesh = null;
  let interactiveMeshes = [];
  let animatedObjects = {};
  let activeClockParts = null;
  let hoveredRoot = null;
  let onObjectClickCallback = null;
  let isExitingSequence = false;
  let clock = new THREE.Clock();

  const camState = {
    pos: new THREE.Vector3(0, 1.75, 4.1),
    targetPos: new THREE.Vector3(0, 1.75, 4.1),
    yaw: 0,
    pitch: -0.05,
    targetYaw: 0,
    targetPitch: -0.05,
    isDragging: false,
    dragDistance: 0,
    prevX: 0,
    prevY: 0
  };

  const moveControls = {
    forward: false,
    backward: false,
    left: false,
    right: false
  };

  const OBJECT_NAMES = {
    desk_drawer: "Laci Meja",
    safe_box: "Brankas Besi",
    bookshelf_left: "Rak Kiri",
    bookshelf_right: "Rak Kanan",
    wooden_chest: "Peti Kayu Tua",
    wall_painting: "Lukisan Dinding",
    side_cabinet: "Lemari Samping",
    antique_desk_item: "Benda Antik Meja",
    corner_stand: "Meja Sudut",
    grandfather_clock: "Jam Pendulum Antik",
    door: "Pintu Ruangan"
  };

  const SEARCHABLE_IDS = [
    "desk_drawer",
    "safe_box",
    "bookshelf_left",
    "bookshelf_right",
    "wooden_chest",
    "wall_painting",
    "side_cabinet",
    "antique_desk_item",
    "corner_stand",
    "grandfather_clock"
  ];

  function createWoodTexture(baseHex, grainHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = grainHex;
    for (let i = 0; i < 95; i++) {
      const y = Math.random() * 512;
      const h = 1 + Math.random() * 4;
      ctx.globalAlpha = 0.12 + Math.random() * 0.22;
      ctx.fillRect(0, y, 512, h);
    }
    ctx.globalAlpha = 0.35;
    for (let y = 0; y < 512; y += 64) {
      ctx.fillRect(0, y, 512, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return tex;
  }

  function createAgedWallTexture(baseHex, stainHex, mortarHex, isBrick = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 512, 512);

    if (isBrick) {
      ctx.strokeStyle = mortarHex;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.45;
      const rows = 16;
      const cols = 8;
      const rowH = 512 / rows;
      const colW = 512 / cols;
      for (let r = 0; r < rows; r++) {
        const y = r * rowH;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
        const offset = (r % 2) * (colW / 2);
        for (let c = 0; c <= cols; c++) {
          const x = c * colW + offset;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + rowH);
          ctx.stroke();
        }
      }
    }

    for (let i = 0; i < 160; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = 8 + Math.random() * 48;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = stainHex;
      ctx.globalAlpha = 0.04 + Math.random() * 0.08;
      ctx.fill();
    }

    ctx.strokeStyle = '#141414';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.28;
    for (let k = 0; k < 8; k++) {
      let cx = Math.random() * 512;
      let cy = Math.random() * 512;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 6; s++) {
        cx += (Math.random() - 0.5) * 35;
        cy += Math.random() * 30;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 2);
    return tex;
  }

  function createClockDialTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const cx = 256, cy = 256, r = 236;

    const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, r);
    grad.addColorStop(0, '#fbf6eb');
    grad.addColorStop(0.82, '#efe3c8');
    grad.addColorStop(1, '#cbb78d');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2b2116';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 24, 0, Math.PI * 2);
    ctx.stroke();

    const numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    ctx.fillStyle = '#1c150e';
    ctx.font = 'bold 34px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const isHour = i % 5 === 0;
      const innerR = isHour ? r - 38 : r - 28;
      const outerR = r - 15;

      ctx.strokeStyle = '#1c150e';
      ctx.lineWidth = isHour ? 4 : 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
      ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
      ctx.stroke();

      if (isHour) {
        const numIdx = i / 5;
        const textR = r - 66;
        const tx = cx + Math.cos(angle) * textR;
        const ty = cy + Math.sin(angle) * textR;
        ctx.fillText(numerals[numIdx], tx, ty);
      }
    }

    return new THREE.CanvasTexture(canvas);
  }

  function registerInteractive(mesh, objectId, rootObj) {
    mesh.userData.objectId = objectId;
    mesh.userData.rootObj = rootObj || mesh;
    interactiveMeshes.push(mesh);
  }

  function init(onClickCallback) {
    onObjectClickCallback = onClickCallback;
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1014);
    scene.fog = new THREE.FogExp2(0x0d1014, 0.045);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 130);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    const ambientLight = new THREE.AmbientLight(0xd6cfc2, 0.45);
    scene.add(ambientLight);

    ceilingPointLight = new THREE.PointLight(0xffcf87, 1.6, 18, 1.45);
    ceilingPointLight.position.set(0, 3.35, 0);
    ceilingPointLight.castShadow = true;
    ceilingPointLight.shadow.mapSize.width = 1024;
    ceilingPointLight.shadow.mapSize.height = 1024;
    ceilingPointLight.shadow.bias = -0.001;
    scene.add(ceilingPointLight);

    roomGroup = new THREE.Group();
    scene.add(roomGroup);

    outdoorGroup = new THREE.Group();
    scene.add(outdoorGroup);

    buildOutdoorScenery();
    buildRoom(1);
    setupEvents(renderer.domElement);
    setupMovePadButtons();
    setupKeyboardAndWheelControls();
    animate();
  }

  function buildOutdoorScenery() {
    while (outdoorGroup.children.length > 0) {
      outdoorGroup.remove(outdoorGroup.children[0]);
    }

    const grassMat = new THREE.MeshStandardMaterial({ color: 0x3b8c3e, roughness: 0.9 });
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(0, -0.02, -30);
    outdoorGroup.add(grass);

    const pathMat = new THREE.MeshStandardMaterial({ color: 0xc9bea7, roughness: 0.85 });
    const path = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 24), pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.0, -16);
    outdoorGroup.add(path);

    const fenceMat = new THREE.MeshStandardMaterial({ color: 0xe6e1d6, roughness: 0.7 });
    for (let z = -7; z >= -22; z -= 2.2) {
      [-1.6, 1.6].forEach(fx => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), fenceMat);
        post.position.set(fx, 0.45, z);
        outdoorGroup.add(post);
      });
    }

    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff5bd });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(2.4, 24, 24), sunMat);
    sun.position.set(9, 13, -38);
    outdoorGroup.add(sun);

    const sunLight = new THREE.DirectionalLight(0xfff5d6, 1.35);
    sunLight.position.set(9, 15, -22);
    outdoorGroup.add(sunLight);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3c21, roughness: 0.9 });
    const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x2d7a36, roughness: 0.75 });
    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x459e48, roughness: 0.75 });

    const treePositions = [
      [-4.4, -9.5], [4.4, -9.5],
      [-6.8, -14.5], [6.8, -14.5],
      [-3.8, -19.0], [5.0, -20.0],
      [-8.8, -23.0], [8.8, -23.0],
      [0.0, -28.5]
    ];

    treePositions.forEach(([tx, tz], idx) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.45, 2.6, 12), trunkMat);
      trunk.position.y = 1.3;
      tree.add(trunk);

      const foliage = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.85 + (idx % 2) * 0.35, 1),
        idx % 2 === 0 ? leafMat1 : leafMat2
      );
      foliage.position.y = 3.3;
      tree.add(foliage);

      tree.position.set(tx, 0, tz);
      outdoorGroup.add(tree);
    });
  }

  function clearRoom() {
    while (roomGroup.children.length > 0) {
      roomGroup.remove(roomGroup.children[0]);
    }
    interactiveMeshes = [];
    animatedObjects = {};
    activeClockParts = null;
    hoveredRoot = null;
    isExitingSequence = false;
    moveControls.forward = false;
    moveControls.backward = false;
    moveControls.left = false;
    moveControls.right = false;
    scene.background = new THREE.Color(0x0d1014);
    scene.fog = new THREE.FogExp2(0x0d1014, 0.045);
  }

  function buildCurtainedWindow(x, y, z, rotY, curtainColorHex) {
    const winGroup = new THREE.Group();
    winGroup.position.set(x, y, z);
    winGroup.rotation.y = rotY;
    roomGroup.add(winGroup);

    const darkGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(1.55, 1.95),
      new THREE.MeshStandardMaterial({ color: 0x090b0d, roughness: 0.3, metalness: 0.2 })
    );
    darkGlass.position.z = -0.02;
    winGroup.add(darkGlass);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x24201c, roughness: 0.8 });
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 0.18), frameMat);
    topBar.position.y = 1.02;
    winGroup.add(topBar);

    const botSill = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.16, 0.26), frameMat);
    botSill.position.y = -1.04;
    winGroup.add(botSill);

    [-0.84, 0.84].forEach(fx => {
      const sideBar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.08, 0.18), frameMat);
      sideBar.position.x = fx;
      winGroup.add(sideBar);
    });

    const rodMat = new THREE.MeshStandardMaterial({ color: 0x1c1a17, metalness: 0.85, roughness: 0.35 });
    const curtainRod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.25, 14), rodMat);
    curtainRod.rotation.z = Math.PI / 2;
    curtainRod.position.set(0, 1.18, 0.16);
    winGroup.add(curtainRod);

    [-1.14, 1.14].forEach(rx => {
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), rodMat);
      finial.position.set(rx, 1.18, 0.16);
      winGroup.add(finial);
    });

    const curtainMat = new THREE.MeshStandardMaterial({
      color: curtainColorHex,
      roughness: 0.94,
      metalness: 0.02
    });

    const numPleats = 16;
    const totalWidth = 1.96;
    const pleatWidth = totalWidth / numPleats;
    const curtainHeight = 2.38;

    for (let i = 0; i < numPleats; i++) {
      const px = -totalWidth / 2 + pleatWidth / 2 + i * pleatWidth;
      const waveDepth = (i % 2 === 0) ? 0.075 : 0.045;
      const waveZ = (i % 2 === 0) ? 0.165 : 0.135;

      const pleat = new THREE.Mesh(
        new THREE.BoxGeometry(pleatWidth * 1.08, curtainHeight, waveDepth),
        curtainMat
      );
      pleat.position.set(px, -0.02, waveZ);
      pleat.castShadow = true;
      pleat.receiveShadow = true;
      winGroup.add(pleat);

      if (i % 2 === 0) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 8, 16), rodMat);
        ring.rotation.y = Math.PI / 2;
        ring.position.set(px, 1.18, 0.16);
        winGroup.add(ring);
      }
    }
  }

  function buildHangingChandelier() {
    ceilingLampGroup = new THREE.Group();
    ceilingLampGroup.position.set(0, 4.2, 0);
    roomGroup.add(ceilingLampGroup);

    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1f1d1a, metalness: 0.8, roughness: 0.35 });
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 10), ironMat);
    rod.position.y = -0.375;
    ceilingLampGroup.add(rod);

    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.36, 0.24, 20, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x2b302c, metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide })
    );
    shade.position.y = -0.78;
    ceilingLampGroup.add(shade);

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffe4a3 })
    );
    bulb.position.y = -0.84;
    ceilingLampGroup.add(bulb);
  }

  function buildShellAndDoor(wallTex, floorTex, doorColorHex, trimColorHex) {
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      bumpMap: floorTex,
      bumpScale: 0.025,
      roughness: 0.72
    });
    floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    roomGroup.add(floorMesh);

    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x1d1f21, roughness: 0.92 });
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 4.2;
    roomGroup.add(ceiling);

    const beamMat = new THREE.MeshStandardMaterial({ color: 0x26211c, roughness: 0.85 });
    [-3.2, -1.1, 1.1, 3.2].forEach(bz => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(10, 0.22, 0.24), beamMat);
      beam.position.set(0, 4.09, bz);
      beam.castShadow = true;
      roomGroup.add(beam);
    });

    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      bumpMap: wallTex,
      bumpScale: 0.04,
      roughness: 0.88
    });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(10, 4.2, 0.25), wallMat);
    backWall.position.set(0, 2.1, 5);
    backWall.receiveShadow = true;
    roomGroup.add(backWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4.2, 10), wallMat);
    rightWall.position.set(5, 2.1, 0);
    rightWall.receiveShadow = true;
    roomGroup.add(rightWall);

    const leftWallBack = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4.2, 4.7), wallMat);
    leftWallBack.position.set(-5, 2.1, 2.65);
    leftWallBack.receiveShadow = true;
    roomGroup.add(leftWallBack);

    const leftWallFront = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4.2, 3.7), wallMat);
    leftWallFront.position.set(-5, 2.1, -3.15);
    leftWallFront.receiveShadow = true;
    roomGroup.add(leftWallFront);

    const leftWallBottom = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.15, 1.6), wallMat);
    leftWallBottom.position.set(-5, 0.575, -0.5);
    leftWallBottom.receiveShadow = true;
    roomGroup.add(leftWallBottom);

    const leftWallTop = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.05, 1.6), wallMat);
    leftWallTop.position.set(-5, 3.675, -0.5);
    leftWallTop.receiveShadow = true;
    roomGroup.add(leftWallTop);

    const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(4.1, 4.2, 0.25), wallMat);
    frontLeft.position.set(-2.95, 2.1, -5);
    frontLeft.receiveShadow = true;
    roomGroup.add(frontLeft);

    const frontRight = new THREE.Mesh(new THREE.BoxGeometry(4.1, 4.2, 0.25), wallMat);
    frontRight.position.set(2.95, 2.1, -5);
    frontRight.receiveShadow = true;
    roomGroup.add(frontRight);

    const frontTop = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 0.25), wallMat);
    frontTop.position.set(0, 3.45, -5);
    frontTop.receiveShadow = true;
    roomGroup.add(frontTop);

    const trimMat = new THREE.MeshStandardMaterial({ color: trimColorHex, roughness: 0.7 });
    [[-4.85, -4.85], [4.85, -4.85], [-4.85, 4.85], [4.85, 4.85]].forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 4.2, 0.32), trimMat);
      pillar.position.set(px, 2.1, pz);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      roomGroup.add(pillar);
    });

    const doorFrameTop = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.18, 0.36), trimMat);
    doorFrameTop.position.set(0, 2.75, -5);
    roomGroup.add(doorFrameTop);

    [-0.94, 0.94].forEach(dx => {
      const doorJamb = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.75, 0.36), trimMat);
      doorJamb.position.set(dx, 1.375, -5);
      roomGroup.add(doorJamb);
    });

    const doorPivot = new THREE.Group();
    doorPivot.position.set(-0.85, 0, -4.95);
    roomGroup.add(doorPivot);

    const doorMat = new THREE.MeshStandardMaterial({ color: doorColorHex, roughness: 0.55 });
    const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.68, 0.12), doorMat);
    doorMesh.position.set(0.85, 1.34, 0);
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    doorPivot.add(doorMesh);
    registerInteractive(doorMesh, "door", doorPivot);

    const panelMat = new THREE.MeshStandardMaterial({ color: trimColorHex, roughness: 0.6 });
    [2.1, 0.75].forEach(py => {
      const relief = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.85, 0.15), panelMat);
      relief.position.set(0.85, py, 0);
      doorPivot.add(relief);
    });

    const handleMat = new THREE.MeshStandardMaterial({ color: 0xe6be6a, metalness: 0.85, roughness: 0.2 });
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 16), handleMat);
    handle.position.set(1.48, 1.25, 0.1);
    doorPivot.add(handle);

    const lockIndicators = {};
    ['A', 'B', 'C'].forEach((keyId, idx) => {
      const lockMat = new THREE.MeshStandardMaterial({
        color: 0xc93b2b,
        emissive: 0x59120a,
        roughness: 0.3
      });
      const lockMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.09), lockMat);
      lockMesh.position.set(0.85, 1.78 - idx * 0.28, 0.09);
      doorPivot.add(lockMesh);
      lockIndicators[keyId] = lockMesh;
      registerInteractive(lockMesh, "door", doorPivot);
    });

    animatedObjects["door"] = {
      pivot: doorPivot,
      open: false,
      targetRotY: 0,
      lockIndicators
    };

    buildHangingChandelier();
  }

  function buildArmChair(x, z, rotY, seatColorHex, woodTex) {
    const chair = new THREE.Group();
    chair.position.set(x, 0, z);
    chair.rotation.y = rotY;
    roomGroup.add(chair);

    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.6 });
    const cushionMat = new THREE.MeshStandardMaterial({ color: seatColorHex, roughness: 0.85 });

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 0.65), cushionMat);
    seat.position.y = 0.46;
    seat.castShadow = true;
    chair.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.65, 0.12), cushionMat);
    back.position.set(0, 0.82, -0.26);
    back.castShadow = true;
    chair.add(back);

    [[-0.28, -0.26], [0.28, -0.26], [-0.28, 0.26], [0.28, 0.26]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.46, 0.08), woodMat);
      leg.position.set(lx, 0.23, lz);
      chair.add(leg);
    });
  }

  function buildPottedFern(x, z) {
    const potGroup = new THREE.Group();
    potGroup.position.set(x, 0, z);
    roomGroup.add(potGroup);

    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.18, 0.42, 16),
      new THREE.MeshStandardMaterial({ color: 0x5c3624, roughness: 0.8 })
    );
    pot.position.y = 0.21;
    pot.castShadow = true;
    potGroup.add(pot);

    const leafMat = new THREE.MeshStandardMaterial({ color: 0x264d2b, roughness: 0.75 });
    for (let i = 0; i < 7; i++) {
      const frond = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.58, 6), leafMat);
      const angle = (i / 7) * Math.PI * 2;
      frond.position.set(Math.cos(angle) * 0.14, 0.56, Math.sin(angle) * 0.14);
      frond.rotation.z = Math.cos(angle) * -0.45;
      frond.rotation.x = Math.sin(angle) * 0.45;
      potGroup.add(frond);
    }
  }

  function buildGrandfatherClock(x, z, rotY, woodTex, id) {
    const clockGroup = new THREE.Group();
    clockGroup.position.set(x, 0, z);
    clockGroup.rotation.y = rotY;
    roomGroup.add(clockGroup);

    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, bumpMap: woodTex, bumpScale: 0.015, roughness: 0.5 });
    const darkInteriorMat = new THREE.MeshStandardMaterial({ color: 0x140e0a, roughness: 0.9 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xe6be6a, metalness: 0.88, roughness: 0.22 });

    const plinthBottom = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.16, 0.54), woodMat);
    plinthBottom.position.y = 0.08;
    plinthBottom.castShadow = true;
    clockGroup.add(plinthBottom);

    const baseCabinet = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.52, 0.48), woodMat);
    baseCabinet.position.y = 0.42;
    baseCabinet.castShadow = true;
    clockGroup.add(baseCabinet);
    registerInteractive(baseCabinet, id, clockGroup);

    const basePanel = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.34, 0.50), woodMat);
    basePanel.position.y = 0.42;
    clockGroup.add(basePanel);

    const waistBack = new THREE.Mesh(new THREE.BoxGeometry(0.64, 1.24, 0.08), woodMat);
    waistBack.position.set(0, 1.30, -0.18);
    clockGroup.add(waistBack);

    const waistInterior = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 1.18), darkInteriorMat);
    waistInterior.position.set(0, 1.30, -0.13);
    clockGroup.add(waistInterior);

    [-0.29, 0.29].forEach(sx => {
      const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.24, 0.42), woodMat);
      sideWall.position.set(sx, 1.30, 0.01);
      sideWall.castShadow = true;
      clockGroup.add(sideWall);
      registerInteractive(sideWall, id, clockGroup);
    });

    const glassDoor = new THREE.Mesh(
      new THREE.PlaneGeometry(0.52, 1.16),
      new THREE.MeshStandardMaterial({
        color: 0xdbeafe,
        transparent: true,
        opacity: 0.22,
        roughness: 0.15,
        metalness: 0.1
      })
    );
    glassDoor.position.set(0, 1.30, 0.20);
    clockGroup.add(glassDoor);
    registerInteractive(glassDoor, id, clockGroup);

    [-0.14, 0.14].forEach(wx => {
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.45, 6), brassMat);
      chain.position.set(wx, 1.62, 0.02);
      clockGroup.add(chain);

      const weightCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.22, 12), brassMat);
      weightCyl.position.set(wx, 1.32, 0.02);
      clockGroup.add(weightCyl);
    });

    const pendulumPivot = new THREE.Group();
    pendulumPivot.position.set(0, 1.82, 0.06);
    clockGroup.add(pendulumPivot);

    const pendRod = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.85, 8), brassMat);
    pendRod.position.y = -0.425;
    pendulumPivot.add(pendRod);

    const pendDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 24), brassMat);
    pendDisc.rotation.x = Math.PI / 2;
    pendDisc.position.y = -0.86;
    pendulumPivot.add(pendDisc);

    const hoodBox = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.72, 0.48), woodMat);
    hoodBox.position.set(0, 2.28, 0);
    hoodBox.castShadow = true;
    clockGroup.add(hoodBox);
    registerInteractive(hoodBox, id, clockGroup);

    [-0.33, 0.33].forEach(cx => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 0.66, 12), woodMat);
      col.position.set(cx, 2.28, 0.23);
      clockGroup.add(col);
    });

    const crownArch = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.46, 20, 1, false, 0, Math.PI), woodMat);
    crownArch.rotation.z = Math.PI / 2;
    crownArch.rotation.y = Math.PI / 2;
    crownArch.position.set(0, 2.64, 0);
    clockGroup.add(crownArch);

    const topFinial = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), brassMat);
    topFinial.position.set(0, 3.04, 0.04);
    clockGroup.add(topFinial);

    const dialBezel = new THREE.Mesh(
      new THREE.TorusGeometry(0.255, 0.022, 12, 32),
      brassMat
    );
    dialBezel.position.set(0, 2.28, 0.245);
    clockGroup.add(dialBezel);

    const dialTex = createClockDialTexture();
    const dialFace = new THREE.Mesh(
      new THREE.CircleGeometry(0.25, 32),
      new THREE.MeshStandardMaterial({ map: dialTex, roughness: 0.4 })
    );
    dialFace.position.set(0, 2.28, 0.246);
    clockGroup.add(dialFace);
    registerInteractive(dialFace, id, clockGroup);

    const handMat = new THREE.MeshStandardMaterial({ color: 0x14110e, metalness: 0.7, roughness: 0.3 });

    const hourHandPivot = new THREE.Group();
    hourHandPivot.position.set(0, 2.28, 0.254);
    clockGroup.add(hourHandPivot);
    const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.13, 0.008), handMat);
    hourHand.position.y = 0.055;
    hourHandPivot.add(hourHand);

    const minuteHandPivot = new THREE.Group();
    minuteHandPivot.position.set(0, 2.28, 0.258);
    clockGroup.add(minuteHandPivot);
    const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.19, 0.008), handMat);
    minuteHand.position.y = 0.085;
    minuteHandPivot.add(minuteHand);

    const centerPin = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 10), brassMat);
    centerPin.position.set(0, 2.28, 0.262);
    clockGroup.add(centerPin);

    activeClockParts = {
      pendulumPivot,
      hourHandPivot,
      minuteHandPivot
    };
  }

  function buildLevel1Office() {
    OBJECT_NAMES.desk_drawer = "Laci Meja Kantor";
    OBJECT_NAMES.safe_box = "Brankas Besi Kantor";
    OBJECT_NAMES.bookshelf_left = "Rak Arsip Kiri";
    OBJECT_NAMES.bookshelf_right = "Rak Dokumen Belakang";
    OBJECT_NAMES.wooden_chest = "Peti Kayu Tua";
    OBJECT_NAMES.wall_painting = "Lukisan Dinding";
    OBJECT_NAMES.side_cabinet = "Lemari Arsip Samping";
    OBJECT_NAMES.antique_desk_item = "Mesin Tik & Berkas Meja";
    OBJECT_NAMES.corner_stand = "Meja Kecil & Kotak Surat";
    OBJECT_NAMES.grandfather_clock = "Jam Pendulum Kantor";
    OBJECT_NAMES.door = "Pintu ke Perpustakaan Rahasia";

    const woodFloor = createWoodTexture('#3d3228', '#211a14');
    const woodDesk = createWoodTexture('#594330', '#332519');
    const wallStoneGray = createAgedWallTexture('#52585e', '#2d3236', '#3a3f45', true);

    ceilingPointLight.color.setHex(0xffd28a);

    buildShellAndDoor(wallStoneGray, woodFloor, 0x363b40, 0x26292c);
    buildCurtainedWindow(-4.88, 2.15, -0.5, Math.PI / 2, 0x2c3238);

    const officeRug = new THREE.Mesh(
      new THREE.PlaneGeometry(3.8, 3.6),
      new THREE.MeshStandardMaterial({ color: 0x3b4248, roughness: 0.94 })
    );
    officeRug.rotation.x = -Math.PI / 2;
    officeRug.position.set(2.1, 0.01, -0.2);
    officeRug.receiveShadow = true;
    roomGroup.add(officeRug);

    const deskMat = new THREE.MeshStandardMaterial({ map: woodDesk, bumpMap: woodDesk, bumpScale: 0.02, roughness: 0.55 });
    const deskGroup = new THREE.Group();
    deskGroup.position.set(2.45, 0, -0.2);
    deskGroup.rotation.y = -Math.PI / 2;
    roomGroup.add(deskGroup);

    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 1.25), deskMat);
    deskTop.position.y = 0.85;
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    [[-1.15, -0.5], [1.15, -0.5], [-1.15, 0.5], [1.15, 0.5]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.85, 0.14), deskMat);
      leg.position.set(lx, 0.425, lz);
      leg.castShadow = true;
      deskGroup.add(leg);
    });

    const drawerGroup = new THREE.Group();
    drawerGroup.position.set(0.68, 0.62, 0.1);
    deskGroup.add(drawerGroup);

    const drawerBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.34, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x473628, roughness: 0.5 })
    );
    drawerBox.castShadow = true;
    drawerGroup.add(drawerBox);
    registerInteractive(drawerBox, "desk_drawer", drawerGroup);

    const knob = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xd9b15f, metalness: 0.8 })
    );
    knob.position.set(0, 0, 0.52);
    drawerGroup.add(knob);
    animatedObjects["desk_drawer"] = { group: drawerGroup, open: false, baseZ: 0.1, targetZ: 0.52 };

    const typewriterGroup = new THREE.Group();
    typewriterGroup.position.set(0.05, 0.92, -0.05);
    deskGroup.add(typewriterGroup);

    const twBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.14, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x1f2428, metalness: 0.7, roughness: 0.35 })
    );
    twBase.position.y = 0.07;
    twBase.castShadow = true;
    typewriterGroup.add(twBase);
    registerInteractive(twBase, "antique_desk_item", typewriterGroup);

    const twRoller = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.52, 16),
      new THREE.MeshStandardMaterial({ color: 0x3b4045 })
    );
    twRoller.rotation.z = Math.PI / 2;
    twRoller.position.set(0, 0.18, -0.08);
    typewriterGroup.add(twRoller);
    registerInteractive(twRoller, "antique_desk_item", typewriterGroup);

    const twPaper = new THREE.Mesh(
      new THREE.PlaneGeometry(0.28, 0.32),
      new THREE.MeshStandardMaterial({ color: 0xf0e8d5, side: THREE.DoubleSide })
    );
    twPaper.position.set(0, 0.28, -0.1);
    twPaper.rotation.x = -0.25;
    typewriterGroup.add(twPaper);

    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.06, 16), new THREE.MeshStandardMaterial({ color: 0xb58d3d, metalness: 0.75 }));
    lampBase.position.set(-0.92, 0.95, -0.2);
    deskGroup.add(lampBase);
    const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 12), new THREE.MeshStandardMaterial({ color: 0xb58d3d }));
    lampStem.position.set(-0.92, 1.15, -0.2);
    deskGroup.add(lampStem);
    const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.2, 16), new THREE.MeshStandardMaterial({ color: 0x1e6b3b, emissive: 0x0e381d }));
    lampShade.position.set(-0.92, 1.38, -0.2);
    deskGroup.add(lampShade);

    const paperMat = new THREE.MeshStandardMaterial({ color: 0xe6dec8, roughness: 0.9 });
    for (let p = 0; p < 4; p++) {
      const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.48), paperMat);
      sheet.position.set(-0.52 + p * 0.03, 0.93 + p * 0.02, 0.15);
      sheet.rotation.y = (p - 1.5) * 0.16;
      deskGroup.add(sheet);
    }

    buildArmChair(3.55, -0.2, -Math.PI / 2, 0x3b2a20, woodDesk);
    buildArmChair(1.35, -0.75, Math.PI / 2 - 0.12, 0x2f3840, woodDesk);
    buildArmChair(1.35, 0.45, Math.PI / 2 + 0.12, 0x2f3840, woodDesk);

    const safeGroup = new THREE.Group();
    safeGroup.position.set(3.85, 0.55, -3.7);
    safeGroup.rotation.y = -0.35;
    roomGroup.add(safeGroup);

    const safeBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.1, 0.95),
      new THREE.MeshStandardMaterial({ color: 0x2b333a, metalness: 0.7, roughness: 0.35 })
    );
    safeBody.castShadow = true;
    safeGroup.add(safeBody);
    registerInteractive(safeBody, "safe_box", safeGroup);

    const safeDoorPivot = new THREE.Group();
    safeDoorPivot.position.set(-0.48, 0, 0.49);
    safeGroup.add(safeDoorPivot);

    const safeDoor = new THREE.Mesh(
      new THREE.BoxGeometry(0.96, 0.96, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x3b464f, metalness: 0.8, roughness: 0.25 })
    );
    safeDoor.position.set(0.48, 0, 0);
    safeDoorPivot.add(safeDoor);
    registerInteractive(safeDoor, "safe_box", safeGroup);

    const dial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.08, 20),
      new THREE.MeshStandardMaterial({ color: 0xd9b15f, metalness: 0.85 })
    );
    dial.rotation.x = Math.PI / 2;
    dial.position.set(0.62, 0, 0.06);
    safeDoorPivot.add(dial);
    animatedObjects["safe_box"] = { pivot: safeDoorPivot, open: false, targetRotY: 0 };

    buildBookshelf(-4.45, -3.1, Math.PI / 2, woodFloor, "bookshelf_left");
    buildBookshelf(1.2, 4.45, Math.PI, woodFloor, "bookshelf_right");
    buildWoodenChest(-3.6, 2.8, 0.45, woodDesk, "wooden_chest");

    const cornerTable = new THREE.Group();
    cornerTable.position.set(-2.6, 0, -4.1);
    roomGroup.add(cornerTable);
    const ctTop = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.78, 0.75), deskMat);
    ctTop.position.y = 0.39;
    ctTop.castShadow = true;
    cornerTable.add(ctTop);
    registerInteractive(ctTop, "corner_stand", cornerTable);

    const mailBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.22, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x7a5932, roughness: 0.6 })
    );
    mailBox.position.set(0, 0.89, 0);
    cornerTable.add(mailBox);
    registerInteractive(mailBox, "corner_stand", cornerTable);

    buildGrandfatherClock(3.95, 4.35, Math.PI, woodDesk, "grandfather_clock");

    buildPainting(4.84, 2.55, -0.2, -Math.PI / 2, "wall_painting");
    buildSideCabinet(4.25, 2.1, -Math.PI / 2, woodFloor, "side_cabinet");
    buildPottedFern(-4.1, 4.1);
    buildPottedFern(2.2, -4.2);
  }

  function buildLevel2Library() {
    OBJECT_NAMES.desk_drawer = "Laci Meja Baca";
    OBJECT_NAMES.safe_box = "Brankas Katalog";
    OBJECT_NAMES.bookshelf_left = "Rak Buku Klasik Kiri";
    OBJECT_NAMES.bookshelf_right = "Rak Ensiklopedia Kanan";
    OBJECT_NAMES.wooden_chest = "Peti Manuskrip";
    OBJECT_NAMES.wall_painting = "Lukisan Cendekiawan";
    OBJECT_NAMES.side_cabinet = "Lemari Arsip Kuno";
    OBJECT_NAMES.antique_desk_item = "Bola Dunia & Tumpukan Buku";
    OBJECT_NAMES.corner_stand = "Meja Katalog & Lilin";
    OBJECT_NAMES.grandfather_clock = "Jam Pendulum Perpustakaan";
    OBJECT_NAMES.door = "Pintu ke Ruang Tamu Tua";

    const woodMahogany = createWoodTexture('#4a251b', '#26100a');
    const woodFloor = createWoodTexture('#33261d', '#1c140e');
    const wallLibraryGreen = createAgedWallTexture('#2b3d38', '#182420', '#1f2e29', false);

    ceilingPointLight.color.setHex(0xffe2a8);

    buildShellAndDoor(wallLibraryGreen, woodFloor, 0x3b2219, 0x241712);
    buildCurtainedWindow(-4.88, 2.15, -0.5, Math.PI / 2, 0x4f181f);

    const carpet = new THREE.Mesh(
      new THREE.PlaneGeometry(5.4, 6.4),
      new THREE.MeshStandardMaterial({ color: 0x661c24, roughness: 0.92 })
    );
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.01, -0.3);
    carpet.receiveShadow = true;
    roomGroup.add(carpet);

    const deskMat = new THREE.MeshStandardMaterial({ map: woodMahogany, bumpMap: woodMahogany, bumpScale: 0.02, roughness: 0.5 });
    const deskGroup = new THREE.Group();
    deskGroup.position.set(0.1, 0, -1.1);
    roomGroup.add(deskGroup);

    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.14, 1.35), deskMat);
    deskTop.position.y = 0.85;
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    [[-1.3, -0.54], [1.3, -0.54], [-1.3, 0.54], [1.3, 0.54]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.85, 0.14), deskMat);
      leg.position.set(lx, 0.425, lz);
      leg.castShadow = true;
      deskGroup.add(leg);
    });

    const drawerGroup = new THREE.Group();
    drawerGroup.position.set(-0.65, 0.62, 0.1);
    deskGroup.add(drawerGroup);

    const drawerBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.34, 1.05),
      new THREE.MeshStandardMaterial({ color: 0x5c2b1f, roughness: 0.45 })
    );
    drawerBox.castShadow = true;
    drawerGroup.add(drawerBox);
    registerInteractive(drawerBox, "desk_drawer", drawerGroup);
    animatedObjects["desk_drawer"] = { group: drawerGroup, open: false, baseZ: 0.1, targetZ: 0.52 };

    const globeGroup = new THREE.Group();
    globeGroup.position.set(0.88, 0.92, -0.15);
    deskGroup.add(globeGroup);

    const globeStand = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.1, 16), new THREE.MeshStandardMaterial({ color: 0xc99d44, metalness: 0.8 }));
    globeStand.position.y = 0.05;
    globeGroup.add(globeStand);
    registerInteractive(globeStand, "antique_desk_item", globeGroup);

    const globeSphere = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 24), new THREE.MeshStandardMaterial({ color: 0x2b6b8a, roughness: 0.4 }));
    globeSphere.position.y = 0.32;
    globeSphere.castShadow = true;
    globeGroup.add(globeSphere);
    registerInteractive(globeSphere, "antique_desk_item", globeGroup);

    [0x7a2323, 0x1e4d38, 0x263f6b].forEach((bCol, bi) => {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.06, 0.28),
        new THREE.MeshStandardMaterial({ color: bCol, roughness: 0.7 })
      );
      book.position.set(-0.15, 0.95 + bi * 0.06, 0.12);
      book.rotation.y = bi * 0.22;
      deskGroup.add(book);
    });

    buildArmChair(-0.5, -2.05, 0, 0x5c1d24, woodMahogany);
    buildArmChair(0.7, -2.05, 0, 0x5c1d24, woodMahogany);
    buildArmChair(0.1, -0.1, Math.PI, 0x5c1d24, woodMahogany);

    buildBookshelf(-4.45, -3.1, Math.PI / 2, woodMahogany, "bookshelf_left");
    buildBookshelf(-4.45, 2.2, Math.PI / 2, woodMahogany, "bookshelf_left");
    buildBookshelf(4.45, -2.6, -Math.PI / 2, woodMahogany, "bookshelf_right");
    buildBookshelf(4.45, 0.2, -Math.PI / 2, woodMahogany, "side_cabinet");

    const safeGroup = new THREE.Group();
    safeGroup.position.set(3.85, 0.55, 2.4);
    safeGroup.rotation.y = -Math.PI / 2 - 0.2;
    roomGroup.add(safeGroup);
    const safeBody = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.05, 0.9), new THREE.MeshStandardMaterial({ color: 0x2e353b, metalness: 0.6 }));
    safeBody.castShadow = true;
    safeGroup.add(safeBody);
    registerInteractive(safeBody, "safe_box", safeGroup);

    const safeDoorPivot = new THREE.Group();
    safeDoorPivot.position.set(-0.46, 0, 0.47);
    safeGroup.add(safeDoorPivot);
    const safeDoor = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.92, 0.08), new THREE.MeshStandardMaterial({ color: 0x8f6b32, metalness: 0.75 }));
    safeDoor.position.set(0.46, 0, 0);
    safeDoorPivot.add(safeDoor);
    registerInteractive(safeDoor, "safe_box", safeGroup);
    animatedObjects["safe_box"] = { pivot: safeDoorPivot, open: false, targetRotY: 0 };

    const catTable = new THREE.Group();
    catTable.position.set(-2.5, 0, -4.1);
    roomGroup.add(catTable);
    const catBox = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.85, 0.7), deskMat);
    catBox.position.y = 0.425;
    catBox.castShadow = true;
    catTable.add(catBox);
    registerInteractive(catBox, "corner_stand", catTable);

    buildGrandfatherClock(3.95, 4.35, Math.PI, woodMahogany, "grandfather_clock");

    buildWoodenChest(-3.2, 3.8, 0.2, woodMahogany, "wooden_chest");
    buildPainting(0, 2.55, 4.84, Math.PI, "wall_painting");
    buildPottedFern(2.2, -4.2);
  }

  function buildLevel3OldLivingRoom() {
    OBJECT_NAMES.desk_drawer = "Laci Meja Tamu Tua";
    OBJECT_NAMES.safe_box = "Brankas Sudut Ruang Tamu";
    OBJECT_NAMES.bookshelf_left = "Rak Pajangan Kiri";
    OBJECT_NAMES.bookshelf_right = "Lemari Pajangan Kanan";
    OBJECT_NAMES.wooden_chest = "Peti Kayu Ruang Tamu";
    OBJECT_NAMES.wall_painting = "Lukisan Klasik Ruang Tamu";
    OBJECT_NAMES.side_cabinet = "Bufet Ruang Tamu Tua";
    OBJECT_NAMES.antique_desk_item = "Perangkat Teh & Buku Tua";
    OBJECT_NAMES.corner_stand = "Meja Sudut & Gramofon";
    OBJECT_NAMES.grandfather_clock = "Jam Pendulum Ruang Tamu";
    OBJECT_NAMES.door = "Pintu Keluar Rumah";

    const woodDusty = createWoodTexture('#52463a', '#302922');
    const floorPale = createWoodTexture('#3b352f', '#211d1a');
    const wallLivingSlate = createAgedWallTexture('#5b6166', '#363b40', '#454a4f', false);

    ceilingPointLight.color.setHex(0xffebd2);

    buildShellAndDoor(wallLivingSlate, floorPale, 0x3b4045, 0x292d30);
    buildCurtainedWindow(-4.88, 2.15, -0.5, Math.PI / 2, 0x283645);

    const oldRug = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 3.8),
      new THREE.MeshStandardMaterial({ color: 0x3b454e, roughness: 0.95 })
    );
    oldRug.rotation.x = -Math.PI / 2;
    oldRug.position.set(0, 0.01, -0.2);
    oldRug.receiveShadow = true;
    roomGroup.add(oldRug);

    const sofaMat = new THREE.MeshStandardMaterial({ color: 0x3c464f, roughness: 0.92 });
    const sofaGroup = new THREE.Group();
    sofaGroup.position.set(-3.2, 0, 1.4);
    sofaGroup.rotation.y = Math.PI / 2;
    roomGroup.add(sofaGroup);

    const sofaSeat = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.42, 0.85), sofaMat);
    sofaSeat.position.y = 0.28;
    sofaSeat.castShadow = true;
    sofaGroup.add(sofaSeat);
    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.65, 0.22), sofaMat);
    sofaBack.position.set(0, 0.68, -0.32);
    sofaBack.castShadow = true;
    sofaGroup.add(sofaBack);
    const sofaArmL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.85), sofaMat);
    sofaArmL.position.set(-1.05, 0.45, 0);
    sofaGroup.add(sofaArmL);
    const sofaArmR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.85), sofaMat);
    sofaArmR.position.set(1.05, 0.45, 0);
    sofaGroup.add(sofaArmR);

    buildArmChair(1.2, -0.8, -Math.PI / 2 - 0.25, 0x3c464f, woodDusty);
    buildArmChair(1.2, 0.9, -Math.PI / 2 + 0.25, 0x3c464f, woodDusty);

    const tableGroup = new THREE.Group();
    tableGroup.position.set(-0.95, 0, 0.1);
    roomGroup.add(tableGroup);

    const tableTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.1, 1.85),
      new THREE.MeshStandardMaterial({ map: woodDusty, roughness: 0.6 })
    );
    tableTop.position.y = 0.52;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    [[-0.48, -0.78], [0.48, -0.78], [-0.48, 0.78], [0.48, 0.78]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.52, 0.1),
        new THREE.MeshStandardMaterial({ map: woodDusty })
      );
      leg.position.set(lx, 0.26, lz);
      tableGroup.add(leg);
    });

    const drawerGroup = new THREE.Group();
    drawerGroup.position.set(0.1, 0.38, 0);
    tableGroup.add(drawerGroup);

    const drawerBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.2, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x5c4f42, roughness: 0.5 })
    );
    drawerGroup.add(drawerBox);
    registerInteractive(drawerBox, "desk_drawer", drawerGroup);
    animatedObjects["desk_drawer"] = { group: drawerGroup, open: false, baseZ: 0, targetZ: 0.42 };

    const teaGroup = new THREE.Group();
    teaGroup.position.set(0, 0.57, -0.25);
    tableGroup.add(teaGroup);

    const tray = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.26, 0.03, 20),
      new THREE.MeshStandardMaterial({ color: 0xb58d3d, metalness: 0.75 })
    );
    teaGroup.add(tray);
    registerInteractive(tray, "antique_desk_item", teaGroup);

    const teapot = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xd9d2c5, roughness: 0.3 })
    );
    teapot.position.set(-0.06, 0.11, 0);
    teaGroup.add(teapot);
    registerInteractive(teapot, "antique_desk_item", teaGroup);

    const fpGroup = new THREE.Group();
    fpGroup.position.set(0.6, 0, 4.55);
    roomGroup.add(fpGroup);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x45494d, roughness: 0.9 });
    const fpBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.65, 0.75), stoneMat);
    fpBody.position.y = 0.825;
    fpBody.castShadow = true;
    fpGroup.add(fpBody);

    const fpHole = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.95, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x12100e })
    );
    fpHole.position.set(0, 0.48, -0.2);
    fpGroup.add(fpHole);

    const fpMantel = new THREE.Mesh(
      new THREE.BoxGeometry(2.45, 0.14, 0.9),
      new THREE.MeshStandardMaterial({ map: woodDusty, roughness: 0.6 })
    );
    fpMantel.position.y = 1.7;
    fpGroup.add(fpMantel);

    const gramGroup = new THREE.Group();
    gramGroup.position.set(-2.55, 0, -4.05);
    roomGroup.add(gramGroup);

    const gramStand = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.82, 0.75),
      new THREE.MeshStandardMaterial({ map: woodDusty, roughness: 0.6 })
    );
    gramStand.position.y = 0.41;
    gramStand.castShadow = true;
    gramGroup.add(gramStand);
    registerInteractive(gramStand, "corner_stand", gramGroup);

    const gramBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.16, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x4a3321 })
    );
    gramBase.position.y = 0.9;
    gramGroup.add(gramBase);
    registerInteractive(gramBase, "corner_stand", gramGroup);

    const gramHorn = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.45, 20, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25, side: THREE.DoubleSide })
    );
    gramHorn.position.set(0.05, 1.22, 0.05);
    gramHorn.rotation.z = -0.65;
    gramGroup.add(gramHorn);
    registerInteractive(gramHorn, "corner_stand", gramGroup);

    buildGrandfatherClock(3.95, 4.35, Math.PI, woodDusty, "grandfather_clock");

    const safeGroup = new THREE.Group();
    safeGroup.position.set(3.8, 0.55, -3.6);
    safeGroup.rotation.y = -0.4;
    roomGroup.add(safeGroup);
    const safeBody = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.05, 0.9), new THREE.MeshStandardMaterial({ color: 0x343c42, metalness: 0.65 }));
    safeBody.castShadow = true;
    safeGroup.add(safeBody);
    registerInteractive(safeBody, "safe_box", safeGroup);

    const safeDoorPivot = new THREE.Group();
    safeDoorPivot.position.set(-0.46, 0, 0.47);
    safeGroup.add(safeDoorPivot);
    const safeDoor = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.92, 0.08), new THREE.MeshStandardMaterial({ color: 0x4d575e, metalness: 0.75 }));
    safeDoor.position.set(0.46, 0, 0);
    safeDoorPivot.add(safeDoor);
    registerInteractive(safeDoor, "safe_box", safeGroup);
    animatedObjects["safe_box"] = { pivot: safeDoorPivot, open: false, targetRotY: 0 };

    buildEmptyShelf(-4.45, -3.2, Math.PI / 2, woodDusty, "bookshelf_left");
    buildBookshelf(4.45, -1.6, -Math.PI / 2, woodDusty, "bookshelf_right");
    buildWoodenChest(3.3, 1.8, -0.5, woodDusty, "wooden_chest");
    buildPainting(4.84, 2.55, 0.8, -Math.PI / 2, "wall_painting");
    buildSideCabinet(-2.2, 4.35, Math.PI, woodDusty, "side_cabinet");
    buildPottedFern(2.2, -4.2);
    buildPottedFern(-3.9, 3.9);
  }

  function buildBookshelf(x, z, rotY, woodTex, id) {
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(x, 0, z);
    shelfGroup.rotation.y = rotY;
    roomGroup.add(shelfGroup);

    const shelfMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.65 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.9, 0.52), shelfMat);
    frame.position.y = 1.45;
    frame.castShadow = true;
    frame.receiveShadow = true;
    shelfGroup.add(frame);
    registerInteractive(frame, id, shelfGroup);

    const bookColors = [0x8c2d23, 0x264b73, 0x2f633a, 0x8f6b24, 0x593163, 0x733b22];
    for (let row = 0; row < 4; row++) {
      const yPos = 0.52 + row * 0.62;
      for (let b = 0; b < 7; b++) {
        const bookMat = new THREE.MeshStandardMaterial({ color: bookColors[(row + b) % bookColors.length] });
        const book = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.44, 0.36), bookMat);
        book.position.set(-0.72 + b * 0.24, yPos, 0.14);
        book.castShadow = true;
        shelfGroup.add(book);
        registerInteractive(book, id, shelfGroup);
      }
    }
  }

  function buildEmptyShelf(x, z, rotY, woodTex, id) {
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(x, 0, z);
    shelfGroup.rotation.y = rotY;
    roomGroup.add(shelfGroup);

    const shelfMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.75 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.6, 0.48), shelfMat);
    frame.position.y = 1.3;
    frame.castShadow = true;
    shelfGroup.add(frame);
    registerInteractive(frame, id, shelfGroup);

    const oldBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.25, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x6e6254 })
    );
    oldBox.position.set(-0.4, 1.15, 0.14);
    shelfGroup.add(oldBox);
    registerInteractive(oldBox, id, shelfGroup);
  }

  function buildWoodenChest(x, z, rotY, woodTex, id) {
    const chestGroup = new THREE.Group();
    chestGroup.position.set(x, 0, z);
    chestGroup.rotation.y = rotY;
    roomGroup.add(chestGroup);

    const chestMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.55 });
    const chestBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.55, 0.72), chestMat);
    chestBase.position.y = 0.275;
    chestBase.castShadow = true;
    chestGroup.add(chestBase);
    registerInteractive(chestBase, id, chestGroup);

    const strapMat = new THREE.MeshStandardMaterial({ color: 0x26292c, metalness: 0.75, roughness: 0.4 });
    [-0.42, 0.42].forEach(sx => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.57, 0.75), strapMat);
      strap.position.set(sx, 0.285, 0);
      chestGroup.add(strap);
    });

    const chestLidPivot = new THREE.Group();
    chestLidPivot.position.set(0, 0.55, -0.36);
    chestGroup.add(chestLidPivot);

    const chestLid = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.18, 0.76), chestMat);
    chestLid.position.set(0, 0.09, 0.36);
    chestLid.castShadow = true;
    chestLidPivot.add(chestLid);
    registerInteractive(chestLid, id, chestGroup);

    animatedObjects[id] = { pivot: chestLidPivot, open: false, targetRotX: 0 };
  }

  function buildPainting(x, y, z, rotY, id) {
    const artGroup = new THREE.Group();
    artGroup.position.set(x, y, z);
    artGroup.rotation.y = rotY;
    roomGroup.add(artGroup);

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.55, 1.18, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x9c7934, metalness: 0.65, roughness: 0.3 })
    );
    frame.castShadow = true;
    artGroup.add(frame);
    registerInteractive(frame, id, artGroup);

    const canvasArt = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 0.95),
      new THREE.MeshStandardMaterial({ color: 0x1e3342, roughness: 0.7 })
    );
    canvasArt.position.z = 0.055;
    artGroup.add(canvasArt);
    registerInteractive(canvasArt, id, artGroup);

    animatedObjects[id] = { group: artGroup, open: false, targetRotZ: 0 };
  }

  function buildSideCabinet(x, z, rotY, woodTex, id) {
    const cabGroup = new THREE.Group();
    cabGroup.position.set(x, 0, z);
    cabGroup.rotation.y = rotY;
    roomGroup.add(cabGroup);

    const cabBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 1.35, 0.58),
      new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.6 })
    );
    cabBody.position.y = 0.675;
    cabBody.castShadow = true;
    cabGroup.add(cabBody);
    registerInteractive(cabBody, id, cabGroup);
  }

  function buildRoom(levelNum) {
    clearRoom();
    if (levelNum === 1) {
      buildLevel1Office();
    } else if (levelNum === 2) {
      buildLevel2Library();
    } else {
      buildLevel3OldLivingRoom();
    }
  }

  function updateDoorLocks(keyA, keyB, keyC) {
    const doorObj = animatedObjects["door"];
    if (!doorObj || !doorObj.lockIndicators) return;
    const statusMap = { A: keyA, B: keyB, C: keyC };

    Object.keys(statusMap).forEach(k => {
      const indicator = doorObj.lockIndicators[k];
      if (!indicator) return;
      if (statusMap[k]) {
        indicator.material.color.setHex(0x36c759);
        indicator.material.emissive.setHex(0x115922);
      } else {
        indicator.material.color.setHex(0xc93b2b);
        indicator.material.emissive.setHex(0x59120a);
      }
    });
  }

  function setObjectOpen(objectId, isOpen) {
    const item = animatedObjects[objectId];
    if (!item) return;
    item.open = isOpen;

    if (objectId === "desk_drawer") {
      item.targetZ = isOpen ? item.baseZ + 0.42 : item.baseZ;
    } else if (objectId === "safe_box") {
      item.targetRotY = isOpen ? -1.45 : 0;
    } else if (objectId === "wooden_chest") {
      item.targetRotX = isOpen ? -0.95 : 0;
    } else if (objectId === "wall_painting") {
      item.targetRotZ = isOpen ? 0.16 : 0;
    } else if (objectId === "door") {
      item.targetRotY = isOpen ? -1.45 : 0;
    }
  }

  function focusCamera(preset) {
    isExitingSequence = false;
    if (preset === 'door') {
      camState.targetPos.set(0, 1.75, -1.5);
      camState.targetYaw = 0;
      camState.targetPitch = -0.04;
    } else {
      camState.targetPos.set(0, 1.75, 4.1);
      camState.targetYaw = 0;
      camState.targetPitch = -0.05;
    }
  }

  function playExitNatureSequence(onComplete) {
    isExitingSequence = true;
    setObjectOpen('door', true);
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x9bd7f0, 0.014);

    camState.targetPos.set(0, 1.85, -11.5);
    camState.targetYaw = 0;
    camState.targetPitch = 0.04;

    setTimeout(() => {
      if (onComplete) onComplete();
    }, 2400);
  }

  function setHighlight(rootObj, active) {
    if (!rootObj) return;
    rootObj.traverse(child => {
      if (child.isMesh && child.material && child.material.emissive) {
        if (active) {
          if (child.userData.origEmissive === undefined) {
            child.userData.origEmissive = child.material.emissive.getHex();
          }
          child.material.emissive.setHex(0x3d2e14);
        } else if (child.userData.origEmissive !== undefined) {
          child.material.emissive.setHex(child.userData.origEmissive);
        }
      }
    });
  }

  function clampCameraBounds() {
    camState.targetPos.x = Math.max(-4.0, Math.min(4.0, camState.targetPos.x));
    camState.targetPos.z = Math.max(-4.0, Math.min(4.1, camState.targetPos.z));
  }

  function stepMove(forwardAmount, rightAmount) {
    if (isExitingSequence) return;
    const forwardX = -Math.sin(camState.yaw);
    const forwardZ = -Math.cos(camState.yaw);
    const rightX = Math.cos(camState.yaw);
    const rightZ = -Math.sin(camState.yaw);

    camState.targetPos.x += forwardX * forwardAmount + rightX * rightAmount;
    camState.targetPos.z += forwardZ * forwardAmount + rightZ * rightAmount;
    clampCameraBounds();
  }

  function setupMovePadButtons() {
    const bindHoldButton = (btnId, dirKey) => {
      const btn = document.getElementById(btnId);
      if (!btn) return;

      const startMove = (e) => {
        e.preventDefault();
        e.stopPropagation();
        moveControls[dirKey] = true;
        btn.classList.add('pressed');
      };

      const stopMove = (e) => {
        if (e) e.stopPropagation();
        moveControls[dirKey] = false;
        btn.classList.remove('pressed');
      };

      btn.addEventListener('pointerdown', startMove);
      btn.addEventListener('pointerup', stopMove);
      btn.addEventListener('pointerleave', stopMove);
      btn.addEventListener('pointercancel', stopMove);
      btn.addEventListener('mousedown', startMove);
      btn.addEventListener('mouseup', stopMove);
      btn.addEventListener('touchstart', startMove, { passive: false });
      btn.addEventListener('touchend', stopMove);
    };

    bindHoldButton('btn-move-up', 'forward');
    bindHoldButton('btn-move-down', 'backward');
    bindHoldButton('btn-move-left', 'left');
    bindHoldButton('btn-move-right', 'right');

    const resetAllMoves = () => {
      moveControls.forward = false;
      moveControls.backward = false;
      moveControls.left = false;
      moveControls.right = false;
      document.querySelectorAll('.btn-move').forEach(b => b.classList.remove('pressed'));
    };

    window.addEventListener('pointerup', resetAllMoves);
    window.addEventListener('mouseup', resetAllMoves);
    window.addEventListener('touchend', resetAllMoves);
    window.addEventListener('blur', resetAllMoves);
  }

  function setupKeyboardAndWheelControls() {
    window.addEventListener('keydown', (e) => {
      const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea') return;

      const key = e.key.toLowerCase();
      if (key === 'w' || e.key === 'ArrowUp') {
        e.preventDefault();
        moveControls.forward = true;
        const btn = document.getElementById('btn-move-up');
        if (btn) btn.classList.add('pressed');
      } else if (key === 's' || e.key === 'ArrowDown') {
        e.preventDefault();
        moveControls.backward = true;
        const btn = document.getElementById('btn-move-down');
        if (btn) btn.classList.add('pressed');
      } else if (key === 'a' || e.key === 'ArrowLeft') {
        e.preventDefault();
        moveControls.left = true;
        const btn = document.getElementById('btn-move-left');
        if (btn) btn.classList.add('pressed');
      } else if (key === 'd' || e.key === 'ArrowRight') {
        e.preventDefault();
        moveControls.right = true;
        const btn = document.getElementById('btn-move-right');
        if (btn) btn.classList.add('pressed');
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || e.key === 'ArrowUp') {
        moveControls.forward = false;
        const btn = document.getElementById('btn-move-up');
        if (btn) btn.classList.remove('pressed');
      } else if (key === 's' || e.key === 'ArrowDown') {
        moveControls.backward = false;
        const btn = document.getElementById('btn-move-down');
        if (btn) btn.classList.remove('pressed');
      } else if (key === 'a' || e.key === 'ArrowLeft') {
        moveControls.left = false;
        const btn = document.getElementById('btn-move-left');
        if (btn) btn.classList.remove('pressed');
      } else if (key === 'd' || e.key === 'ArrowRight') {
        moveControls.right = false;
        const btn = document.getElementById('btn-move-right');
        if (btn) btn.classList.remove('pressed');
      }
    });

    // Gestur 2 jari di trackpad laptop: atas-bawah (maju-mundur) & kiri-kanan (geser samping)
    window.addEventListener('wheel', (e) => {
      const startOverlay = document.getElementById('start-screen');
      const puzzleModal = document.getElementById('puzzle-modal');
      if (startOverlay && !startOverlay.classList.contains('hidden')) return;
      if (puzzleModal && !puzzleModal.classList.contains('hidden')) return;

      const deltaY = Math.max(-1, Math.min(1, -e.deltaY * 0.01));
      const deltaX = Math.max(-1, Math.min(1, e.deltaX * 0.01));
      stepMove(deltaY * 0.35, deltaX * 0.35);
    }, { passive: true });
    
    let prevTouchMidX = null;
    let prevTouchMidY = null;

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        camState.isDragging = false;
        prevTouchMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        prevTouchMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 2 || prevTouchMidX === null || prevTouchMidY === null) return;
      const startOverlay = document.getElementById('start-screen');
      const puzzleModal = document.getElementById('puzzle-modal');
      if (startOverlay && !startOverlay.classList.contains('hidden')) return;
      if (puzzleModal && !puzzleModal.classList.contains('hidden')) return;

      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const dx = midX - prevTouchMidX;
      const dy = midY - prevTouchMidY;
      prevTouchMidX = midX;
      prevTouchMidY = midY;

      stepMove(-dy * 0.015, dx * 0.015);
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        prevTouchMidX = null;
        prevTouchMidY = null;
      }
    }, { passive: true });
  }

  function setupEvents(domElement) {
    const tooltip = document.getElementById('tooltip');

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    domElement.addEventListener('pointerdown', (e) => {
      camState.isDragging = true;
      camState.dragDistance = 0;
      camState.prevX = e.clientX;
      camState.prevY = e.clientY;
    });

    window.addEventListener('pointermove', (e) => {
      if (camState.isDragging) {
        const dx = e.clientX - camState.prevX;
        const dy = e.clientY - camState.prevY;
        camState.dragDistance += Math.hypot(dx, dy);
        camState.prevX = e.clientX;
        camState.prevY = e.clientY;

        camState.targetYaw -= dx * 0.0052;
        camState.targetPitch = Math.max(-0.65, Math.min(0.65, camState.targetPitch - dy * 0.0042));
      }

      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(interactiveMeshes, false);

      if (hits.length > 0 && !isExitingSequence) {
        const hit = hits[0].object;
        const root = hit.userData.rootObj;
        const objId = hit.userData.objectId;

        if (hoveredRoot !== root) {
          setHighlight(hoveredRoot, false);
          hoveredRoot = root;
          setHighlight(hoveredRoot, true);
        }

        domElement.style.cursor = 'pointer';
        tooltip.style.display = 'block';
        tooltip.style.left = `${e.clientX + 14}px`;
        tooltip.style.top = `${e.clientY + 14}px`;
        tooltip.textContent = OBJECT_NAMES[objId] || "Periksa Benda";
      } else {
        if (hoveredRoot) {
          setHighlight(hoveredRoot, false);
          hoveredRoot = null;
        }
        domElement.style.cursor = camState.isDragging ? 'grabbing' : 'grab';
        tooltip.style.display = 'none';
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (!camState.isDragging) return;
      camState.isDragging = false;

      if (camState.dragDistance < 6 && !isExitingSequence) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(interactiveMeshes, false);
        if (hits.length > 0 && onObjectClickCallback) {
          const objId = hits[0].object.userData.objectId;
          onObjectClickCallback(objId);
        }
      }
    });
  }

  function updateMovement() {
    if (isExitingSequence) return;

    const speed = 0.095;
    let fwd = 0;
    let rgt = 0;

    if (moveControls.forward) fwd += speed;
    if (moveControls.backward) fwd -= speed;
    if (moveControls.left) rgt -= speed;
    if (moveControls.right) rgt += speed;

    if (fwd !== 0 || rgt !== 0) {
      stepMove(fwd, rgt);
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    updateMovement();

    if (ceilingLampGroup) {
      ceilingLampGroup.rotation.z = Math.sin(elapsed * 1.1) * 0.025;
      ceilingLampGroup.rotation.x = Math.cos(elapsed * 0.85) * 0.018;
    }
    if (ceilingPointLight) {
      ceilingPointLight.intensity = 1.55 + Math.sin(elapsed * 7.5) * 0.035;
    }

    if (activeClockParts) {
      activeClockParts.pendulumPivot.rotation.z = Math.sin(elapsed * 2.4) * 0.14;
      const now = new Date();
      const mins = now.getMinutes() + now.getSeconds() / 60;
      const hours = (now.getHours() % 12) + mins / 60;
      activeClockParts.minuteHandPivot.rotation.z = -(mins / 60) * Math.PI * 2;
      activeClockParts.hourHandPivot.rotation.z = -(hours / 12) * Math.PI * 2;
    }

    camState.pos.lerp(camState.targetPos, isExitingSequence ? 0.035 : 0.16);
    camState.yaw += (camState.targetYaw - camState.yaw) * 0.14;
    camState.pitch += (camState.targetPitch - camState.pitch) * 0.14;

    camera.position.copy(camState.pos);
    const euler = new THREE.Euler(camState.pitch, camState.yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);

    const drawer = animatedObjects["desk_drawer"];
    if (drawer) drawer.group.position.z += (drawer.targetZ - drawer.group.position.z) * 0.12;

    const safe = animatedObjects["safe_box"];
    if (safe) safe.pivot.rotation.y += (safe.targetRotY - safe.pivot.rotation.y) * 0.12;

    const chest = animatedObjects["wooden_chest"];
    if (chest) chest.pivot.rotation.x += (chest.targetRotX - chest.pivot.rotation.x) * 0.12;

    const painting = animatedObjects["wall_painting"];
    if (painting) painting.group.rotation.z += (painting.targetRotZ - painting.group.rotation.z) * 0.12;

    const door = animatedObjects["door"];
    if (door) door.pivot.rotation.y += (door.targetRotY - door.pivot.rotation.y) * 0.1;

    renderer.render(scene, camera);
  }

  return {
    init,
    buildRoom,
    updateDoorLocks,
    setObjectOpen,
    focusCamera,
    playExitNatureSequence,
    OBJECT_NAMES,
    SEARCHABLE_IDS
  };
})();
