/**
 * UI Overlay Component
 * Features:
 * - Start Menu & Pause Menu
 * - Minecraft Health (hearts) & Hunger (drumsticks) bars
 * - 9-Slot Interactive Hotbar with item counts & selection
 * - Cooking progress indicator & Campfire prompts
 * - Game Station Score & Archery Challenge HUD
 * - Villager Dialogue Balloons
 * - Action buttons for Attack / Interact
 */
import React, { useState } from 'react';
import { CameraPerspective, GameTelemetry } from '../game/GameEngine';
import { sound } from '../game/sound';
import {
  Volume2,
  VolumeX,
  Eye,
  Maximize2,
  RotateCcw,
  Play,
  Sliders,
  HelpCircle,
  Flame,
  Target,
  Swords,
  Utensils,
  Compass,
} from 'lucide-react';

interface UIOverlayProps {
  telemetry: GameTelemetry | null;
  gameState: 'start' | 'playing' | 'paused';
  onStartGame: () => void;
  onResumeGame: () => void;
  onPauseGame: () => void;
  onRespawn: () => void;
  onCycleCamera: () => void;
  onSelectSlot: (index: number) => void;
  onAttack: () => void;
  onInteract: () => void;
  cameraPerspective: CameraPerspective;
  settings: {
    sensitivity: number;
    invertY: boolean;
    fov: number;
    cameraDistance: number;
    soundEnabled: boolean;
    volume: number;
    showFps: boolean;
    showCoords: boolean;
  };
  onUpdateSettings: (newSettings: Partial<UIOverlayProps['settings']>) => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  telemetry,
  gameState,
  onStartGame,
  onResumeGame,
  onPauseGame,
  onRespawn,
  onCycleCamera,
  onSelectSlot,
  onAttack,
  onInteract,
  cameraPerspective,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'settings' | 'guide'>('menu');

  const toggleSound = () => {
    const next = !settings.soundEnabled;
    sound.setEnabled(next);
    onUpdateSettings({ soundEnabled: next });
    if (next) sound.playClick();
  };

  const toggleFullscreen = () => {
    sound.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const cameraModeLabels: Record<CameraPerspective, string> = {
    third_back: '3rd Person (Back)',
    third_front: '3rd Person (Front)',
    first_person: '1st Person',
  };

  // Hearts calculation (20 max = 10 hearts)
  const healthHearts = telemetry ? Math.ceil(telemetry.health / 2) : 10;
  const hungerDrumsticks = telemetry ? Math.ceil(telemetry.hunger / 2) : 10;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-sans">
      {/* 1. START SCREEN */}
      {gameState === 'start' && (
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4 pointer-events-auto z-40">
          <div className="relative w-full max-w-xl bg-[#272727]/95 border-4 border-[#161616] p-8 shadow-2xl rounded-none text-white text-center">
            <div className="mb-4">
              <h1
                className="text-3xl md:text-4xl text-[#ffff55] tracking-wider drop-shadow-[0_4px_0_#3f3f00]"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                BLOCK WORLD
              </h1>
              <p className="mt-3 text-sm text-neutral-300 font-medium">
                Village, Wildlife Hunting, Campfire Cooking & Game Station
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-5 text-left text-[11px]">
              <div className="bg-[#1e1e1e] p-2 border border-[#3c3c3c]">
                <div className="text-yellow-400 font-bold mb-1">🏡 The Village</div>
                <div className="text-neutral-400">Walk north to explore houses, well & farms</div>
              </div>
              <div className="bg-[#1e1e1e] p-2 border border-[#3c3c3c]">
                <div className="text-pink-400 font-bold mb-1">🐷 Hunt Wildlife</div>
                <div className="text-neutral-400">Attack pigs & cows to collect raw meat</div>
              </div>
              <div className="bg-[#1e1e1e] p-2 border border-[#3c3c3c]">
                <div className="text-orange-400 font-bold mb-1">🔥 Cook Food</div>
                <div className="text-neutral-400">Roast meat at campfire to restore hearts</div>
              </div>
              <div className="bg-[#1e1e1e] p-2 border border-[#3c3c3c]">
                <div className="text-emerald-400 font-bold mb-1">🎯 Game Station</div>
                <div className="text-neutral-400">Archery challenge to earn Emeralds</div>
              </div>
            </div>

            {/* Play Button */}
            <div className="space-y-3 max-w-xs mx-auto">
              <button
                onClick={() => {
                  sound.playClick();
                  onStartGame();
                }}
                className="w-full py-3.5 px-6 bg-[#689f38] hover:bg-[#7cb342] active:bg-[#558b2f] border-2 border-t-[#8bc34a] border-l-[#8bc34a] border-b-[#33691e] border-r-[#33691e] text-white font-bold tracking-wider cursor-pointer shadow-md active:translate-y-0.5 flex items-center justify-center gap-2"
                style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '12px' }}
              >
                <Play className="w-4 h-4 fill-white" />
                PLAY GAME
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab(activeTab === 'guide' ? 'menu' : 'guide');
                }}
                className="w-full py-2.5 px-4 bg-[#4a4a4a] hover:bg-[#5a5a5a] border-2 border-t-[#6e6e6e] border-l-[#6e6e6e] border-b-[#2a2a2a] border-r-[#2a2a2a] text-neutral-200 text-xs font-semibold cursor-pointer flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                {activeTab === 'guide' ? 'Hide Controls Guide' : 'Controls & Guide'}
              </button>
            </div>

            {activeTab === 'guide' && (
              <div className="mt-5 p-3.5 bg-[#1a1a1a] border-2 border-[#3a3a3a] text-left text-xs space-y-1.5 text-neutral-300">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-mono text-yellow-300 text-[10px] bg-[#333] px-1 border border-[#555] mr-1.5">
                      W A S D
                    </span>
                    Move
                  </div>
                  <div>
                    <span className="font-mono text-yellow-300 text-[10px] bg-[#333] px-1 border border-[#555] mr-1.5">
                      LEFT CLICK / F
                    </span>
                    Attack / Punch / Shoot
                  </div>
                  <div>
                    <span className="font-mono text-yellow-300 text-[10px] bg-[#333] px-1 border border-[#555] mr-1.5">
                      SPACE
                    </span>
                    Jump
                  </div>
                  <div>
                    <span className="font-mono text-yellow-300 text-[10px] bg-[#333] px-1 border border-[#555] mr-1.5">
                      RIGHT CLICK / E
                    </span>
                    Cook / Eat / Talk
                  </div>
                  <div>
                    <span className="font-mono text-yellow-300 text-[10px] bg-[#333] px-1 border border-[#555] mr-1.5">
                      SHIFT
                    </span>
                    Sprint
                  </div>
                  <div>
                    <span className="font-mono text-yellow-300 text-[10px] bg-[#333] px-1 border border-[#555] mr-1.5">
                      KEYS 1 - 9
                    </span>
                    Select Hotbar Item
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 text-[11px] text-neutral-400">
              Click anywhere on screen to lock cursor and start playing
            </div>
          </div>
        </div>
      )}

      {/* 2. PAUSE MENU */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto z-40">
          <div className="relative w-full max-w-md bg-[#252525] border-4 border-[#141414] p-6 shadow-2xl text-white text-center">
            <h2
              className="text-xl md:text-2xl text-white tracking-wider mb-6 drop-shadow-[0_2px_0_#000]"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              GAME PAUSED
            </h2>

            <div className="flex border-b border-[#3c3c3c] mb-6 justify-center gap-4 text-xs">
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('menu');
                }}
                className={`pb-2 px-3 font-semibold cursor-pointer ${
                  activeTab === 'menu'
                    ? 'text-yellow-400 border-b-2 border-yellow-400'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Actions
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('settings');
                }}
                className={`pb-2 px-3 font-semibold cursor-pointer ${
                  activeTab === 'settings'
                    ? 'text-yellow-400 border-b-2 border-yellow-400'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Settings
              </button>
            </div>

            {activeTab === 'menu' && (
              <div className="space-y-3 max-w-xs mx-auto">
                <button
                  onClick={() => {
                    sound.playClick();
                    onResumeGame();
                  }}
                  className="w-full py-3 px-4 bg-[#4a7c29] hover:bg-[#5b9533] border-2 border-t-[#74b445] border-l-[#74b445] border-b-[#294c14] border-r-[#294c14] text-white font-bold text-xs tracking-wider cursor-pointer"
                  style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '11px' }}
                >
                  RESUME GAME
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    onRespawn();
                    onResumeGame();
                  }}
                  className="w-full py-2.5 px-4 bg-[#3a3a3a] hover:bg-[#4a4a4a] border-2 border-t-[#5a5a5a] border-l-[#5a5a5a] border-b-[#202020] border-r-[#202020] text-neutral-200 text-xs font-semibold cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset to Spawn (0, 0)
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    onCycleCamera();
                  }}
                  className="w-full py-2.5 px-4 bg-[#3a3a3a] hover:bg-[#4a4a4a] border-2 border-t-[#5a5a5a] border-l-[#5a5a5a] border-b-[#202020] border-r-[#202020] text-neutral-200 text-xs font-semibold cursor-pointer flex items-center justify-center gap-2"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Camera: {cameraModeLabels[cameraPerspective]}
                </button>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4 text-left text-xs text-neutral-300 max-h-64 overflow-y-auto pr-1">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Look Sensitivity</span>
                    <span className="font-mono text-neutral-400">
                      {Math.round(settings.sensitivity * 2000)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.001"
                    max="0.005"
                    step="0.0005"
                    value={settings.sensitivity}
                    onChange={(e) =>
                      onUpdateSettings({ sensitivity: parseFloat(e.target.value) })
                    }
                    className="w-full accent-yellow-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Camera Distance</span>
                    <span className="font-mono text-neutral-400">
                      {settings.cameraDistance.toFixed(1)}m
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2.5"
                    max="7.5"
                    step="0.5"
                    value={settings.cameraDistance}
                    onChange={(e) =>
                      onUpdateSettings({ cameraDistance: parseFloat(e.target.value) })
                    }
                    className="w-full accent-yellow-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Field of View</span>
                    <span className="font-mono text-neutral-400">{settings.fov}°</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="90"
                    step="2"
                    value={settings.fov}
                    onChange={(e) => onUpdateSettings({ fov: parseInt(e.target.value) })}
                    className="w-full accent-yellow-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Sound Volume</span>
                    <span className="font-mono text-neutral-400">
                      {Math.round(settings.volume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.volume}
                    onChange={(e) => {
                      const vol = parseFloat(e.target.value);
                      sound.setVolume(vol);
                      onUpdateSettings({ volume: vol });
                    }}
                    className="w-full accent-yellow-400 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span>Invert Vertical Look</span>
                  <input
                    type="checkbox"
                    checked={settings.invertY}
                    onChange={(e) => onUpdateSettings({ invertY: e.target.checked })}
                    className="accent-yellow-400 cursor-pointer w-4 h-4"
                  />
                </div>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => {
                  sound.playClick();
                  onResumeGame();
                }}
                className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
              >
                Click or press ESC to resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. IN-GAME HUD */}
      {gameState === 'playing' && (
        <>
          {/* Subtle Crosshair in Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-75">
            <div className="relative w-4 h-4 flex items-center justify-center">
              <div className="absolute w-[14px] h-[2px] bg-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" />
              <div className="absolute w-[2px] h-[14px] bg-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" />
            </div>
          </div>

          {/* Top-Left Telemetry (F3 style) */}
          {settings.showFps && telemetry && (
            <div className="absolute top-4 left-4 pointer-events-none bg-black/60 backdrop-blur-xs p-3 text-[11px] text-white border border-white/10 font-mono space-y-1 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-[#a8e6cf] font-bold">{telemetry.fps} FPS</span>
                <span className="text-neutral-400">·</span>
                <span className="text-neutral-300">
                  {telemetry.isSprinting
                    ? 'SPRINTING'
                    : telemetry.speed > 0.4
                    ? 'WALKING'
                    : 'IDLE'}
                </span>
              </div>
              <div className="text-neutral-300">
                XYZ: {telemetry.x.toFixed(1)} / {telemetry.y.toFixed(1)} /{' '}
                {telemetry.z.toFixed(1)}
              </div>
              <div className="text-neutral-400 text-[10px]">
                Village: ~{Math.max(0, Math.round(Math.abs(telemetry.z - -40)))}m North
              </div>
            </div>
          )}

          {/* Top-Center Game Station / Archery Tracker */}
          {telemetry && telemetry.gameStation.isActive && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/75 border-2 border-yellow-400/70 py-2.5 px-6 text-center text-white shadow-2xl backdrop-blur-xs animate-bounce">
              <div className="text-xs text-yellow-300 font-bold tracking-wider flex items-center justify-center gap-2">
                <Target className="w-4 h-4 text-red-400" />
                GAME STATION ARCHERY CHALLENGE
              </div>
              <div className="flex items-center gap-4 mt-1 font-mono text-sm">
                <div>
                  Score: <span className="text-yellow-400 font-bold">{telemetry.gameStation.score}</span>
                </div>
                <div className="text-neutral-400">·</div>
                <div>
                  Combo: <span className="text-emerald-400 font-bold">{telemetry.gameStation.combo}x</span>
                </div>
                <div className="text-neutral-400">·</div>
                <div>
                  Time: <span className="text-red-400 font-bold">{Math.ceil(telemetry.gameStation.timeLeft)}s</span>
                </div>
                <div className="text-neutral-400">·</div>
                <div>
                  Emeralds: <span className="text-green-300 font-bold">{telemetry.gameStation.emeralds} 💎</span>
                </div>
              </div>
            </div>
          )}

          {/* Top-Right Utility Buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => {
                sound.playClick();
                onCycleCamera();
              }}
              title="Change Camera View (V)"
              className="p-2 bg-black/55 hover:bg-black/75 text-white border border-white/15 backdrop-blur-xs transition-colors cursor-pointer shadow-md flex items-center gap-1.5 text-xs"
            >
              <Eye className="w-4 h-4 text-yellow-300" />
              <span className="hidden sm:inline text-[11px] font-medium">
                {cameraPerspective === 'first_person'
                  ? '1st Person'
                  : cameraPerspective === 'third_front'
                  ? '3rd Front'
                  : '3rd Back'}
              </span>
            </button>

            <button
              onClick={toggleSound}
              title={settings.soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
              className="p-2 bg-black/55 hover:bg-black/75 text-white border border-white/15 backdrop-blur-xs transition-colors cursor-pointer shadow-md"
            >
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-neutral-400" />
              )}
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onPauseGame();
              }}
              title="Pause Game (Esc)"
              className="px-3 py-2 bg-black/55 hover:bg-black/75 text-white border border-white/15 backdrop-blur-xs transition-colors cursor-pointer text-xs font-semibold shadow-md flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pause</span>
            </button>

            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="p-2 bg-black/55 hover:bg-black/75 text-white border border-white/15 backdrop-blur-xs transition-colors cursor-pointer shadow-md"
            >
              <Maximize2 className="w-4 h-4 text-neutral-200" />
            </button>
          </div>

          {/* Villager Dialogue Speech Balloon */}
          {telemetry && telemetry.activeDialogue && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 max-w-md w-11/12 bg-[#2d241e] border-3 border-[#634832] p-4 text-white shadow-2xl backdrop-blur-sm z-30 animate-fade-in pointer-events-auto">
              <div className="flex items-center gap-2 mb-1.5 text-yellow-400 text-xs font-bold">
                <span className="text-base">👤</span>
                <span>{telemetry.activeDialogue.name}</span>
              </div>
              <p className="text-xs text-neutral-200 leading-relaxed font-medium">
                "{telemetry.activeDialogue.text}"
              </p>
            </div>
          )}

          {/* Contextual Interaction Banner (near Campfire, Game Station, Villager) */}
          {telemetry && telemetry.interactionPrompt && (
            <div className="absolute top-36 left-1/2 -translate-x-1/2 pointer-events-auto bg-black/80 backdrop-blur-xs border-2 border-yellow-400/70 py-2.5 px-5 text-xs text-yellow-200 shadow-2xl flex items-center gap-3">
              <span>{telemetry.interactionPrompt}</span>
              <button
                onClick={onInteract}
                className="px-3 py-1 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black font-bold text-xs cursor-pointer shadow-sm"
              >
                Interact [E]
              </button>
            </div>
          )}

          {/* Pointer Lock Notification (if unlocked during gameplay) */}
          {telemetry && !telemetry.isLocked && !telemetry.interactionPrompt && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-auto bg-black/75 backdrop-blur-xs border border-yellow-400/50 py-2 px-4 text-xs text-yellow-200 shadow-xl flex items-center gap-3">
              <span>Click anywhere on screen to lock mouse and play</span>
              <button
                onClick={onResumeGame}
                className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-[11px] cursor-pointer"
              >
                Lock Mouse
              </button>
            </div>
          )}

          {/* Quick Action Touch / Click Buttons (Right Edge) */}
          <div className="absolute right-4 bottom-24 flex flex-col gap-2.5 pointer-events-auto">
            <button
              onClick={() => {
                sound.playClick();
                onAttack();
              }}
              title="Attack / Punch [Left Click or F]"
              className="w-12 h-12 rounded-lg bg-red-600/85 hover:bg-red-500 active:bg-red-700 border-2 border-red-300 text-white flex items-center justify-center shadow-lg cursor-pointer"
            >
              <Swords className="w-6 h-6" />
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onInteract();
              }}
              title="Interact / Eat / Cook [Right Click or E]"
              className="w-12 h-12 rounded-lg bg-amber-600/85 hover:bg-amber-500 active:bg-amber-700 border-2 border-amber-300 text-white flex items-center justify-center shadow-lg cursor-pointer"
            >
              <Utensils className="w-6 h-6" />
            </button>
          </div>

          {/* BOTTOM HUD: Health Hearts, Hunger Drumsticks, and 9-Slot Hotbar */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-auto">
            {/* Status Bars: Hearts & Hunger */}
            <div className="w-[360px] sm:w-[420px] flex items-center justify-between px-1 text-sm drop-shadow-md">
              {/* Hearts (Health) */}
              <div className="flex items-center gap-0.5" title={`Health: ${telemetry?.health || 20}/20`}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={`heart-${i}`}
                    className={`text-sm ${
                      i < healthHearts ? 'text-red-500' : 'text-neutral-600 opacity-50'
                    }`}
                  >
                    ❤️
                  </span>
                ))}
              </div>

              {/* Hunger (Drumsticks) */}
              <div className="flex items-center gap-0.5" title={`Hunger: ${telemetry?.hunger || 18}/20`}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={`hunger-${i}`}
                    className={`text-sm ${
                      i < hungerDrumsticks ? 'text-amber-500' : 'text-neutral-600 opacity-50'
                    }`}
                  >
                    🍗
                  </span>
                ))}
              </div>
            </div>

            {/* 9-Slot Minecraft Hotbar */}
            <div className="flex items-center bg-[#8f8f8f] p-1 border-3 border-t-[#373737] border-l-[#373737] border-b-[#ffffff] border-r-[#ffffff] shadow-2xl">
              {telemetry &&
                telemetry.hotbar.map((slot, index) => {
                  const isSelected = telemetry.selectedSlot === index;
                  return (
                    <div
                      key={`slot-${index}`}
                      onClick={() => onSelectSlot(index)}
                      title={slot ? `${slot.item.name} (${slot.count})\n${slot.item.description}` : 'Empty Slot'}
                      className={`relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-[#8b8b8b] border-2 cursor-pointer transition-transform ${
                        isSelected
                          ? 'border-white bg-[#ababab] scale-105 z-10 shadow-lg'
                          : 'border-[#373737] hover:bg-[#9c9c9c]'
                      }`}
                    >
                      {/* Slot index label */}
                      <span className="absolute top-0.5 left-1 text-[8px] text-neutral-400 font-mono">
                        {index + 1}
                      </span>

                      {/* Item Icon */}
                      {slot && (
                        <span className="text-xl sm:text-2xl select-none drop-shadow-sm">
                          {slot.item.icon}
                        </span>
                      )}

                      {/* Stack count badge */}
                      {slot && slot.count > 1 && (
                        <span className="absolute bottom-0.5 right-1 text-[10px] font-bold font-mono text-white drop-shadow-[0_1px_1px_#000]">
                          {slot.count}
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Selected item name tooltip */}
            <div className="text-[11px] text-white font-semibold drop-shadow-[0_1px_2px_#000] tracking-wide">
              {telemetry && telemetry.hotbar[telemetry.selectedSlot]
                ? `${telemetry.hotbar[telemetry.selectedSlot]?.item.name} · Press [E] / Right-Click to Use`
                : 'Empty Hand · Punch [Left Click]'}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
