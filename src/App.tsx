/**
 * Main Application Component for Block World 3D
 * Integrates Three.js 3D GameEngine with UIOverlay
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, GameTelemetry, CameraPerspective } from './game/GameEngine';
import { UIOverlay } from './components/UIOverlay';
import { sound } from './game/sound';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused'>('start');
  const [telemetry, setTelemetry] = useState<GameTelemetry | null>(null);
  const [cameraPerspective, setCameraPerspective] = useState<CameraPerspective>('third_back');

  const [settings, setSettings] = useState({
    sensitivity: 0.0022,
    invertY: false,
    fov: 72,
    cameraDistance: 4.8,
    soundEnabled: true,
    volume: 0.6,
    showFps: true,
    showCoords: true,
  });

  // Initialize GameEngine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current, {
      onTelemetry: (t) => {
        setTelemetry(t);
        setCameraPerspective(t.perspective);
      },
      onLockChange: (locked) => {
        if (!locked) {
          // If unlocked while playing, pause game
          setGameState((prev) => (prev === 'playing' ? 'paused' : prev));
        }
      },
    });

    engineRef.current = engine;
    engine.start();

    // Prevent default right clicks or context menus during gameplay
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Update engine when settings change
  const handleUpdateSettings = useCallback((newSettings: Partial<typeof settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (engineRef.current) {
        if (newSettings.sensitivity !== undefined) {
          engineRef.current.setSensitivity(updated.sensitivity);
        }
        if (newSettings.invertY !== undefined) {
          engineRef.current.setInvertY(updated.invertY);
        }
        if (newSettings.fov !== undefined) {
          engineRef.current.setFov(updated.fov);
        }
        if (newSettings.cameraDistance !== undefined) {
          engineRef.current.setCameraDistance(updated.cameraDistance);
        }
      }
      return updated;
    });
  }, []);

  const handleStartGame = useCallback(() => {
    setGameState('playing');
    if (engineRef.current) {
      engineRef.current.requestPointerLock();
    }
  }, []);

  const handleResumeGame = useCallback(() => {
    setGameState('playing');
    if (engineRef.current) {
      engineRef.current.requestPointerLock();
    }
  }, []);

  const handlePauseGame = useCallback(() => {
    setGameState('paused');
    if (engineRef.current) {
      engineRef.current.exitPointerLock();
    }
  }, []);

  const handleRespawn = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.respawn();
    }
  }, []);

  const handleCycleCamera = useCallback(() => {
    if (engineRef.current) {
      const next = engineRef.current.cyclePerspective();
      setCameraPerspective(next);
    }
  }, []);

  const handleSelectSlot = useCallback((index: number) => {
    if (engineRef.current) {
      engineRef.current.selectHotbarSlot(index);
    }
  }, []);

  const handleAttack = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.handleAttack();
    }
  }, []);

  const handleInteract = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.handleInteract();
    }
  }, []);

  const handleCanvasClick = useCallback(() => {
    if (gameState === 'playing' && engineRef.current && !engineRef.current.getIsLocked()) {
      engineRef.current.requestPointerLock();
    }
  }, [gameState]);

  return (
    <main
      className="relative w-screen h-screen overflow-hidden bg-[#8bc3ff] select-none"
      onClick={handleCanvasClick}
    >
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0 cursor-crosshair"
      />

      {/* 2D HTML/Tailwind UI Overlay */}
      <UIOverlay
        telemetry={telemetry}
        gameState={gameState}
        onStartGame={handleStartGame}
        onResumeGame={handleResumeGame}
        onPauseGame={handlePauseGame}
        onRespawn={handleRespawn}
        onCycleCamera={handleCycleCamera}
        onSelectSlot={handleSelectSlot}
        onAttack={handleAttack}
        onInteract={handleInteract}
        cameraPerspective={cameraPerspective}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </main>
  );
}
