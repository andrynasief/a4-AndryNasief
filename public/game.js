(() => {
  // Tiers: radius + color, small -> large
  const TIERS = [
    { r: 0.32, color: 0xff3030 }, // vivid red
    { r: 0.46, color: 0xff7a18 }, // strong orange
    { r: 0.64, color: 0xffd600 }, // bright yellow
    { r: 0.86, color: 0xb8f000 }, // lime
    { r: 1.12, color: 0x24e89a }, // emerald
    { r: 1.42, color: 0x16d9f5 }, // cyan
    { r: 1.76, color: 0x397cff }, // electric blue
    { r: 2.15, color: 0xa855f7 }, // vivid purple
    { r: 2.60, color: 0xff3cac }, // hot pink
  ];

  const MAX_TIER = TIERS.length - 1;

  const SPAWN_WEIGHTS = [5, 4, 3, 1];

  // MERGE SOUND EFFECTS
  let audioCtx = null;

  // higher frequency = higher pitch
  // lower frequency = deeper pitch
  const MERGE_FREQUENCIES = [
    760, // tier 0
    680, // tier 1
    590, // tier 2
    510, // tier 3
    430, // tier 4
    360, // tier 5
    295, // tier 6
    235, // tier 7
    180, // tier 8
  ];

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return null;

      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    return audioCtx;
  }

  function playMergeSound(tier) {
    const ctx = getAudioContext();

    if (!ctx) return;

    const now = ctx.currentTime;

    const frequency =
      MERGE_FREQUENCIES[
        Math.min(tier, MERGE_FREQUENCIES.length - 1)
      ];


    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();

    bodyOsc.type = "sine";

    bodyOsc.frequency.setValueAtTime(
      frequency * 1.45,
      now
    );

    // "plop" feeling (AI HELP)
    bodyOsc.frequency.exponentialRampToValueAtTime(
      frequency,
      now + 0.075
    );

    // Start loud... (AI HELP)
    bodyGain.gain.setValueAtTime(
      0.24,
      now
    );

    // then disappear very quickly (AI HELP)
    bodyGain.gain.exponentialRampToValueAtTime(
      0.001,
      now + 0.14
    );

    bodyOsc.connect(bodyGain);
    bodyGain.connect(ctx.destination);

    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();

    clickOsc.type = "triangle";

    clickOsc.frequency.setValueAtTime(
      frequency * 2.4,
      now
    );

    clickOsc.frequency.exponentialRampToValueAtTime(
      frequency * 1.7,
      now + 0.035
    );

    clickGain.gain.setValueAtTime(
      0.07,
      now
    );

    clickGain.gain.exponentialRampToValueAtTime(
      0.001,
      now + 0.045
    );

    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);

    bodyOsc.start(now);
    clickOsc.start(now);

    clickOsc.stop(now + 0.05);
    bodyOsc.stop(now + 0.15);
  }

  // container geometry
  const CYL_R = 3;
  const CYL_H = 7;

  const DANGER_Y = CYL_H - 1.6;
  const SPAWN_Y = CYL_H + 1.0;

  const DANGER_HOLD = 2.5;

  // physics controls (some AI HELP)
  const params = {
    gravity: -14,
    restitution: 0.32,
    damping: 0.986,
    rotateSpeed: 0.12,
    glassOpacity: 0.16,
  };

  // renderer / scene / camera

  const canvas = document.getElementById("scene");

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.setClearColor(
    0x070b14,
    1
  );

  const scene = new THREE.Scene();

  const camera =
    new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );

  const CAM_DIST = 10;
  const CAM_Y = 10;
  const CAM_LOOK_Y = 4;

  let cameraAngle = 0;

  window.addEventListener(
    "resize",
    () => {
      camera.aspect =
        window.innerWidth /
        window.innerHeight;

      camera.updateProjectionMatrix();

      renderer.setSize(
        window.innerWidth,
        window.innerHeight
      );
    }
  );

  // lighting (some AI debugging)
  scene.add(
    new THREE.AmbientLight(
      0x9db8e8,
      0.6
    )
  );

  const keyLight =
    new THREE.DirectionalLight(
      0xffffff,
      0.9
    );

  keyLight.position.set(
    4,
    10,
    6
  );

  scene.add(keyLight);

  const glow =
    new THREE.PointLight(
      0x7dd8ff,
      0.5,
      20
    );

  glow.position.set(
    0,
    CYL_H + 2,
    0
  );

  scene.add(glow);

  const glassMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0x7dd8ff,
      transparent: true,
      opacity: params.glassOpacity,
      roughness: 0.15,
      metalness: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

  const wallGeo =
    new THREE.CylinderGeometry(
      CYL_R,
      CYL_R,
      CYL_H,
      56,
      1,
      true
    );

  const wallMesh =
    new THREE.Mesh(
      wallGeo,
      glassMaterial
    );

  wallMesh.position.y =
    CYL_H / 2;

  scene.add(wallMesh);

  const edgeMat =
    new THREE.LineBasicMaterial({
      color: 0x9fe6ff,
      transparent: true,
      opacity: 0.5,
    });

  const rimGeo =
    new THREE.EdgesGeometry(
      new THREE.CylinderGeometry(
        CYL_R,
        CYL_R,
        0.001,
        56
      )
    );

  const rimTop =
    new THREE.LineSegments(
      rimGeo,
      edgeMat
    );

  rimTop.position.y =
    CYL_H;

  scene.add(rimTop);

  const rimBottom =
    rimTop.clone();

  rimBottom.position.y =
    0;

  scene.add(rimBottom);

  // danger line
  const dangerGeo =
    new THREE.EdgesGeometry(
      new THREE.CylinderGeometry(
        CYL_R + 0.02,
        CYL_R + 0.02,
        0.001,
        56
      )
    );

  const dangerMat =
    new THREE.LineBasicMaterial({
      color: 0xff9a5a,
      transparent: true,
      opacity: 0.55,
    });

  const dangerLine =
    new THREE.LineSegments(
      dangerGeo,
      dangerMat
    );

  dangerLine.position.y =
    DANGER_Y;

  scene.add(dangerLine);

  const floorMat =
    new THREE.MeshStandardMaterial({
      color: 0x0d1526,
      roughness: 0.7,
      metalness: 0.1,
    });

  const floorMesh =
    new THREE.Mesh(
      new THREE.CircleGeometry(
        CYL_R,
        56
      ),
      floorMat
    );

  floorMesh.rotation.x =
    -Math.PI / 2;

  scene.add(floorMesh);

  const sphereGeometries =
    TIERS.map(
      (t) =>
        new THREE.SphereGeometry(
          t.r,
          32,
          24
        )
    );

  let balls = [];

  function spawnBall(
    tier,
    pos,
    vel
  ) {
    const t =
      TIERS[tier];

    const mat =
      new THREE.MeshPhysicalMaterial({
        color: t.color,
        roughness: 0.15,
        metalness: 0.05,
        clearcoat: 0.6,
        clearcoatRoughness: 0.25,
      });

    const mesh =
      new THREE.Mesh(
        sphereGeometries[tier],
        mat
      );

    mesh.position.copy(pos);

    scene.add(mesh);

    balls.push({
      tier,
      r: t.r,
      pos: pos.clone(),
      vel: vel.clone(),
      mesh,
      age: 0,
    });
  }

  function pickSpawnTier() {
    const total =
      SPAWN_WEIGHTS.reduce(
        (a, b) => a + b,
        0
      );

    let roll =
      Math.random() * total;

    for (
      let i = 0;
      i < SPAWN_WEIGHTS.length;
      i++
    ) {
      if (
        roll <
        SPAWN_WEIGHTS[i]
      ) {
        return i;
      }

      roll -=
        SPAWN_WEIGHTS[i];
    }

    return 0;
  }

  // preview ball
  let nextTier =
    pickSpawnTier();

  const previewMat =
    new THREE.MeshBasicMaterial({
      color:
        TIERS[nextTier].color,
      transparent: true,
      opacity: 0.75,
    });

  const previewMesh =
    new THREE.Mesh(
      sphereGeometries[nextTier],
      previewMat
    );

  scene.add(previewMesh);

  // landing marker (some AI HELP)
  const markerMat =
    new THREE.MeshBasicMaterial({
      color:
        TIERS[nextTier].color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });

  const marker =
    new THREE.Mesh(
      new THREE.CircleGeometry(
        TIERS[nextTier].r,
        40
      ),
      markerMat
    );

  marker.rotation.x =
    -Math.PI / 2;

  marker.position.y =
    0.02;

  scene.add(marker);

  function updatePreviewMesh() {
    previewMesh.geometry =
      sphereGeometries[nextTier];

    previewMesh.material.color.setHex(
      TIERS[nextTier].color
    );

    marker.geometry.dispose();

    marker.geometry =
      new THREE.CircleGeometry(
        TIERS[nextTier].r,
        40
      );

    marker.material.color.setHex(
      TIERS[nextTier].color
    );

    const swatch =
      document.getElementById(
        "next-swatch"
      );

    swatch.style.setProperty(
      "--swatch-color",
      "#" +
        TIERS[nextTier].color
          .toString(16)
          .padStart(6, "0")
    );
  }

  updatePreviewMesh();

  // pointer aiming (hardest thing in this project :/ )
  const raycaster =
    new THREE.Raycaster();

  const ndc =
    new THREE.Vector2(
      0,
      0
    );

  const aimPlane =
    new THREE.Plane(
      new THREE.Vector3(
        0,
        1,
        0
      ),
      -SPAWN_Y
    );

  const aimPoint =
    new THREE.Vector3();

  canvas.addEventListener(
    "pointermove",
    (e) => {
      ndc.x =
        (e.clientX /
          window.innerWidth) *
          2 -
        1;

      ndc.y =
        -(e.clientY /
          window.innerHeight) *
          2 +
        1;
    }
  );

  function updateAim() {
    raycaster.setFromCamera(
      ndc,
      camera
    );

    const hit =
      raycaster.ray.intersectPlane(
        aimPlane,
        aimPoint
      );

    if (!hit) return;

    let x =
      aimPoint.x;

    let z =
      aimPoint.z;

    const r =
      TIERS[nextTier].r;

    const dist =
      Math.hypot(
        x,
        z
      );

    const maxDist =
      CYL_R - r;

    if (
      dist > maxDist &&
      dist > 0
    ) {
      x =
        (x / dist) *
        maxDist;

      z =
        (z / dist) *
        maxDist;
    }

    previewMesh.position.set(
      x,
      SPAWN_Y,
      z
    );

    marker.position.set(
      x,
      0.02,
      z
    );
  }

  let cooldown = 0;

  canvas.addEventListener(
    "pointerdown",
    () => {
      if (
        !gameActive ||
        cooldown > 0
      ) {
        return;
      }

      getAudioContext();

      spawnBall(
        nextTier,
        previewMesh.position,
        new THREE.Vector3(
          0,
          0,
          0
        )
      );

      cooldown = 0.4;

      nextTier =
        pickSpawnTier();

      updatePreviewMesh();
    }
  );

  let score = 0;
  let dangerTimer = 0;
  let gameActive = false;

  function updateScoreDisplay() {
    document.getElementById(
      "score"
    ).textContent =
      String(score);
  }

  function updatePhysics(dt) {
    // gravity and movement
    for (const b of balls) {
      b.vel.y +=
        params.gravity * dt;

      b.pos.addScaledVector(
        b.vel,
        dt
      );

      b.vel.multiplyScalar(
        params.damping
      );

      b.age += dt;
    }

    for (const b of balls) {
      const dist =
        Math.hypot(
          b.pos.x,
          b.pos.z
        );

      const limit =
        CYL_R - b.r;

      if (
        dist > limit &&
        dist > 0
      ) {
        const nx =
          b.pos.x / dist;

        const nz =
          b.pos.z / dist;

        b.pos.x =
          nx * limit;

        b.pos.z =
          nz * limit;

        const vn =
          b.vel.x * nx +
          b.vel.z * nz;

        if (vn > 0) {
          b.vel.x -=
            (1 +
              params.restitution) *
            vn *
            nx;

          b.vel.z -=
            (1 +
              params.restitution) *
            vn *
            nz;
        }
      }

      if (
        b.pos.y - b.r <
        0
      ) {
        b.pos.y =
          b.r;

        if (
          b.vel.y < 0
        ) {
          b.vel.y *=
            -params.restitution;
        }

        b.vel.x *=
          0.98;

        b.vel.z *=
          0.98;
      }
    }

    // merge
    const mergePairs = [];

    const merged =
      new Set();

    for (
      let i = 0;
      i < balls.length;
      i++
    ) {
      for (
        let j = i + 1;
        j < balls.length;
        j++
      ) {
        if (
          merged.has(i) ||
          merged.has(j)
        ) {
          continue;
        }

        const a =
          balls[i];

        const b =
          balls[j];

        const d =
          a.pos.distanceTo(
            b.pos
          );

        const minDist =
          a.r + b.r;

        if (
          d < minDist &&
          d > 0.0001
        ) {

          if (
            a.tier ===
              b.tier &&
            a.tier <
              MAX_TIER
          ) {
            mergePairs.push(
              [i, j]
            );

            merged.add(i);
            merged.add(j);

            continue;
          }

          // COLLISION (AI HELP)
          const nx =
            (b.pos.x -
              a.pos.x) /
            d;

          const ny =
            (b.pos.y -
              a.pos.y) /
            d;

          const nz =
            (b.pos.z -
              a.pos.z) /
            d;

          const overlap =
            minDist - d;

          const massA =
            a.r ** 3;

          const massB =
            b.r ** 3;

          const totalMass =
            massA + massB;

          a.pos.x -=
            nx *
            overlap *
            (massB /
              totalMass);

          a.pos.y -=
            ny *
            overlap *
            (massB /
              totalMass);

          a.pos.z -=
            nz *
            overlap *
            (massB /
              totalMass);

          b.pos.x +=
            nx *
            overlap *
            (massA /
              totalMass);

          b.pos.y +=
            ny *
            overlap *
            (massA /
              totalMass);

          b.pos.z +=
            nz *
            overlap *
            (massA /
              totalMass);

          const rvx =
            b.vel.x -
            a.vel.x;

          const rvy =
            b.vel.y -
            a.vel.y;

          const rvz =
            b.vel.z -
            a.vel.z;

          const velAlongNormal =
            rvx * nx +
            rvy * ny +
            rvz * nz;

          if (
            velAlongNormal <
            0
          ) {
            const jImpulse =
              (-(1 +
                params.restitution) *
                velAlongNormal) /
              (1 / massA +
                1 / massB);

            a.vel.x -=
              (jImpulse * nx) /
              massA;

            a.vel.y -=
              (jImpulse * ny) /
              massA;

            a.vel.z -=
              (jImpulse * nz) /
              massA;

            b.vel.x +=
              (jImpulse * nx) /
              massB;

            b.vel.y +=
              (jImpulse * ny) /
              massB;

            b.vel.z +=
              (jImpulse * nz) /
              massB;
          }
        }
      }
    }

    if (
      mergePairs.length
    ) {
      const toRemove =
        new Set();

      const spawns = [];

      for (
        const [i, j]
        of mergePairs
      ) {
        const a =
          balls[i];

        const b =
          balls[j];

        toRemove.add(a);
        toRemove.add(b);

        const mid =
          a.pos
            .clone()
            .add(b.pos)
            .multiplyScalar(
              0.5
            );

        const newTier =
          a.tier + 1;

        spawns.push({
          tier:
            newTier,
          pos:
            mid,
        });

        // sounds
        playMergeSound(
          newTier
        );

        score +=
          (a.tier + 2) *
          10;
      }

      // remove old balls
      balls =
        balls.filter(
          (b) =>
            !toRemove.has(
              b
            )
        );

      for (
        const b
        of toRemove
      ) {
        scene.remove(
          b.mesh
        );
      }

      // create new merged balls
      for (
        const s
        of spawns
      ) {
        spawnBall(
          s.tier,
          s.pos,
          new THREE.Vector3(
            0,
            1.6,
            0
          )
        );
      }

      updateScoreDisplay();
    }

    // Sync ball positions (AI debugging)
    for (
      const b
      of balls
    ) {
      b.mesh.position.copy(
        b.pos
      );
    }

    // game over check
    const anyDanger =
      balls.some(
        (b) =>
          b.pos.y +
            b.r >
            DANGER_Y &&
          b.vel.length() <
            0.6 &&
          b.age > 1.2
      );

    dangerTimer =
      anyDanger
        ? dangerTimer + dt
        : 0;

    if (
      dangerTimer >
      DANGER_HOLD
    ) {
      triggerGameOver();
    }
  }

  function triggerGameOver() {
    gameActive =
      false;

    document.getElementById(
      "final-score-line"
    ).textContent =
      `Final score: ${score}`;

    document.getElementById(
      "game-over"
    ).classList.remove(
      "hidden"
    );
  }

  function resetGame() {
    for (
      const b
      of balls
    ) {
      scene.remove(
        b.mesh
      );
    }

    balls = [];

    score = 0;

    dangerTimer =
      0;

    updateScoreDisplay();

    nextTier =
      pickSpawnTier();

    updatePreviewMesh();
  }

  // UI
  updateScoreDisplay();

  document.getElementById(
    "start-btn"
  ).addEventListener(
    "click",
    () => {
      // browser audio
      getAudioContext();

      document.getElementById(
        "instructions"
      ).classList.add(
        "hidden"
      );

      gameActive =
        true;
    }
  );

  document.getElementById(
    "restart-btn"
  ).addEventListener(
    "click",
    () => {
      getAudioContext();

      document.getElementById(
        "game-over"
      ).classList.add(
        "hidden"
      );

      resetGame();

      gameActive =
        true;
    }
  );

  document.getElementById(
    "help-btn"
  ).addEventListener(
    "click",
    () => {
      gameActive =
        false;

      document.getElementById(
        "instructions"
      ).classList.remove(
        "hidden"
      );
    }
  );

  document.getElementById(
    "panel-btn"
  ).addEventListener(
    "click",
    () => {
      document.getElementById(
        "pane-holder"
      ).classList.toggle(
        "visible"
      );
    }
  );

  // tweakpane
  const pane =
    new Tweakpane.Pane({
      container:
        document.getElementById(
          "pane-holder"
        ),
      title:
        "Physics",
    });

  pane.addInput(
    params,
    "gravity",
    {
      min: -30,
      max: -3,
      step: 0.5,
      label: "gravity",
    }
  );

  pane.addInput(
    params,
    "restitution",
    {
      min: 0,
      max: 0.9,
      step: 0.01,
      label: "bounciness",
    }
  );

  pane.addInput(
    params,
    "damping",
    {
      min: 0.9,
      max: 1,
      step: 0.001,
      label: "drag",
    }
  );

  pane.addInput(
    params,
    "rotateSpeed",
    {
      min: 0,
      max: 0.6,
      step: 0.01,
      label: "spin speed",
    }
  );

  pane.addInput(
    params,
    "glassOpacity",
    {
      min: 0.03,
      max: 0.5,
      step: 0.01,
      label: "glass opacity",
    }
  );

  // animation loop

  const FIXED_DT =
    1 / 120;

  let accumulator =
    0;

  let lastTime =
    performance.now();

  function animate(now) {
    requestAnimationFrame(
      animate
    );

    const dt =
      Math.min(
        (now -
          lastTime) /
          1000,
        0.05
      );

    lastTime =
      now;

    if (
      gameActive
    ) {
      accumulator +=
        dt;

      let steps =
        0;

      while (
        accumulator >=
          FIXED_DT &&
        steps < 8
      ) {
        updatePhysics(
          FIXED_DT
        );

        accumulator -=
          FIXED_DT;

        steps++;
      }
    }

    if (
      cooldown > 0
    ) {
      cooldown -=
        dt;
    }

    // rotate camera
    cameraAngle +=
      params.rotateSpeed *
      dt;

    camera.position.set(
      Math.sin(
        cameraAngle
      ) * CAM_DIST,
      CAM_Y,
      Math.cos(
        cameraAngle
      ) * CAM_DIST
    );

    camera.lookAt(
      0,
      CAM_LOOK_Y,
      0
    );

    glassMaterial.opacity =
      params.glassOpacity;

    updateAim();

    renderer.render(
      scene,
      camera
    );
  }

  requestAnimationFrame(
    animate
  );
})();