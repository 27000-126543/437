import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { GeometryType } from '@/types';

interface Droplet3DViewProps {
  geometryType: GeometryType;
  channelWidth: number;
  hasSatellite?: boolean;
  animate?: boolean;
}

export default function Droplet3DView({
  geometryType,
  channelWidth,
  hasSatellite,
  animate = true,
}: Droplet3DViewProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    droplets?: THREE.Mesh[];
    frame?: number;
    clock?: THREE.Clock;
  }>({});

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1e3f);
    scene.fog = new THREE.FogExp2(0x0b1e3f, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(12, 9, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x0b1e3f, 1);
    mount.appendChild(renderer.domElement);

    // grid
    const gridHelper = new THREE.GridHelper(40, 40, 0x1f3564, 0x12254a);
    (gridHelper.material as THREE.Material).opacity = 0.5;
    (gridHelper.material as THREE.Material).transparent = true;
    scene.add(gridHelper);

    // Lights
    const ambient = new THREE.AmbientLight(0x404f7a, 0.45);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0x66aaff, 0.9);
    dir.position.set(8, 12, 6);
    scene.add(dir);
    const rim = new THREE.PointLight(0x00d4ff, 1.2, 40);
    rim.position.set(-6, 5, -8);
    scene.add(rim);
    const cyanPoint = new THREE.PointLight(0x00ff88, 0.5, 20);
    scene.add(cyanPoint);

    // Channel
    const channelGroup = new THREE.Group();

    // scale factor from um -> unit
    const s = 0.05;
    const w = channelWidth * s;
    const d = (channelWidth * 0.6) * s;
    const mainLen = 20;

    const channelMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a4a7a,
      transparent: true,
      opacity: 0.22,
      roughness: 0.15,
      metalness: 0.1,
      transmission: 0.8,
      thickness: 0.5,
    });

    if (geometryType === 'T-junction') {
      // T-junction: two perpendicular channels
      const main = new THREE.Mesh(new THREE.BoxGeometry(mainLen, d, w), channelMat);
      const side = new THREE.Mesh(new THREE.BoxGeometry(w, d, mainLen), channelMat);
      side.position.set(0, 0, 0);
      channelGroup.add(main, side);
    } else if (geometryType === 'flow-focusing') {
      // Flow focusing: main channel with side channels converging to orifice
      const main1 = new THREE.Mesh(new THREE.BoxGeometry(mainLen, d, w), channelMat);
      const ori = new THREE.Mesh(new THREE.BoxGeometry(4, d, w * 0.4), channelMat);
      ori.position.set(0, 0, 0);
      const side1 = new THREE.Mesh(new THREE.BoxGeometry(w, d, w), channelMat);
      side1.position.set(0, 0, 0);
      channelGroup.add(main1, ori, side1);
      // side channels
      const chA = new THREE.Mesh(new THREE.BoxGeometry(w * 1.5, d, mainLen * 0.6), channelMat);
      chA.rotation.y = Math.PI / 2;
      chA.position.set(-mainLen * 0.35, 0, 0);
      channelGroup.add(chA);
      const chB = chA.clone();
      chB.position.set(mainLen * 0.35, 0, 0);
      channelGroup.add(chB);
    } else {
      const main = new THREE.Mesh(new THREE.BoxGeometry(mainLen, d, w), channelMat);
      channelGroup.add(main);
    }

    // glass walls
    const wallMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.25 });
    channelGroup.children.forEach((mesh: any) => {
      const edges = new THREE.EdgesGeometry(mesh.geometry);
      const wire = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.5 }));
      wire.position.copy(mesh.position);
      wire.rotation.copy(mesh.rotation);
      channelGroup.add(wire);
    });

    scene.add(channelGroup);

    // Droplets
    const dropletMat = new THREE.MeshPhysicalMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.78,
      roughness: 0.05,
      metalness: 0.0,
      transmission: 0.6,
      thickness: 0.8,
      clearcoat: 1,
      emissive: 0x0077aa,
      emissiveIntensity: 0.25,
    });

    const satMat = new THREE.MeshPhysicalMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      transmission: 0.5,
      emissive: 0x00aaff,
      emissiveIntensity: 0.15,
    });

    const droplets: THREE.Mesh[] = [];
    const dropletPositions = [
      { x: -8, z: -0.2, scale: 1.1 },
      { x: -4, z: 0.1, scale: 0.95 },
      { x: 0.8, z: -0.1, scale: 1.05 },
      { x: 5, z: 0.15, scale: 1.0 },
      { x: 8.5, z: -0.05, scale: 0.9 },
    ];
    dropletPositions.forEach(p => {
      const r = (channelWidth * 0.55) * s;
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(r * p.scale, 48, 48), dropletMat);
      mesh.position.set(p.x, 0, p.z);
      scene.add(mesh);
      droplets.push(mesh);

      // halo
      const halo = new THREE.PointLight(0x00d4ff, 0.3, 4);
      halo.position.copy(mesh.position);
      scene.add(halo);
    });

    // satellite droplets
    if (hasSatellite) {
      for (let i = 0; i < 5; i++) {
        const r = channelWidth * 0.12 * s;
        const sat = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 24), satMat);
        sat.position.set(
          -6 + i * 2.8,
          Math.sin(i) * 0.3,
          Math.cos(i * 1.3) * (channelWidth * 0.25 * s),
        );
        scene.add(sat);
        droplets.push(sat);
      }
    }

    // interface isosurface hint
    const isoGeo = new THREE.PlaneGeometry(mainLen * 0.9, w * 0.9);
    const isoMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    });
    const iso = new THREE.Mesh(isoGeo, isoMat);
    iso.rotation.x = -Math.PI / 2;
    iso.position.y = d / 2 - 0.02;
    scene.add(iso);

    // HUD lines (simulated stream)
    for (let i = 0; i < 12; i++) {
      const pts: THREE.Vector3[] = [];
      for (let t = 0; t <= 1; t += 0.05) {
        pts.push(new THREE.Vector3(-10 + t * 20, 0, Math.sin(t * 8 + i) * w * 0.1));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, new THREE.LineDashedMaterial({
        color: 0x00d4ff, transparent: true, opacity: 0.4, dashSize: 0.3, gapSize: 0.2,
      }));
      (line as any).computeLineDistances();
      scene.add(line);
    }

    sceneRef.current = { renderer, scene, camera, droplets, clock: new THREE.Clock() };

    let rafId = 0;
    const tick = () => {
      if (!sceneRef.current) return;
      const t = sceneRef.current.clock!.getElapsedTime();
      droplets.forEach((m, i) => {
        m.position.x += 0.01 * (0.5 + i * 0.04);
        if (m.position.x > 11) m.position.x = -10;
        m.position.y = Math.sin(t * 1.2 + i) * 0.08;
      });
      channelGroup.rotation.y = Math.sin(t * 0.15) * 0.06;
      camera.position.x = 12 + Math.sin(t * 0.1) * 0.4;
      camera.position.z = 14 + Math.cos(t * 0.12) * 0.4;
      camera.lookAt(0, 0, 0);
      rim.position.x = Math.sin(t * 0.4) * 6;
      cyanPoint.position.z = Math.cos(t * 0.3) * 6;
      renderer.render(scene, camera);
      if (animate) rafId = requestAnimationFrame(tick);
    };
    if (animate) tick();

    const handleResize = () => {
      if (!mount || !sceneRef.current?.renderer || !sceneRef.current?.camera) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      sceneRef.current.camera.aspect = w / h;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      if (mount && renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.traverse(obj => {
        if ((obj as any).geometry) (obj as any).geometry.dispose?.();
        if ((obj as any).material) {
          const mats = Array.isArray((obj as any).material) ? (obj as any).material : [(obj as any).material];
          mats.forEach((m: any) => m.dispose?.());
        }
      });
    };
  }, [geometryType, channelWidth, hasSatellite, animate]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full rounded-lg overflow-hidden relative"
      style={{ background: 'radial-gradient(ellipse at center, #0f2850 0%, #0B1E3F 70%)' }}
    >
      {/* HUD overlay */}
      <div className="absolute top-3 left-3 space-y-1 z-10 pointer-events-none">
        <div className="hud-text">RENDER: THREE.js WEBGL</div>
        <div className="hud-text opacity-70">MESH: ADAPTIVE</div>
        <div className="hud-text opacity-70">VOF: PHASE-FIELD</div>
      </div>
      <div className="absolute top-3 right-3 z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-deep-space/70 border border-tech-cyan/30 backdrop-blur">
          <span className="w-1.5 h-1.5 rounded-full bg-data-green animate-pulse" />
          <span className="hud-text text-[10px]">实时渲染</span>
        </div>
      </div>
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
        <div className="flex items-center justify-between text-[10px] font-mono text-neut-1">
          <span>几何: {geometryType}</span>
          <span>通道宽度: {channelWidth}μm</span>
        </div>
      </div>
    </div>
  );
}
