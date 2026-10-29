<script setup lang="ts">
import type { CurtainPhase } from '~/composables/useRouteCurtain'
defineProps<{ phase: CurtainPhase }>()
</script>

<template>
  <div class="camera-scene" :data-camera-phase="phase">
      <div class="camera-exit">
        <div class="camera-wrap">
          <span class="camera-top"></span><span class="camera-body"></span><span class="camera-grip"></span><span class="viewfinder"></span><span class="dial"></span><span class="shutter-button"></span>
          <div class="lens">
            <svg class="aperture-svg" viewBox="0 0 320 320" aria-hidden="true">
              <defs>
                <radialGradient id="glassGradient" cx="38%" cy="32%" r="76%"><stop offset="0" stop-color="#9bc9bd" stop-opacity=".28"/><stop offset=".12" stop-color="#47766b" stop-opacity=".2"/><stop offset=".48" stop-color="#17362e" stop-opacity=".12"/><stop offset="1" stop-color="#020706" stop-opacity=".32"/></radialGradient>
                <linearGradient id="bladeGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#444b46"/><stop offset=".48" stop-color="#252b27"/><stop offset="1" stop-color="#0f1411"/></linearGradient>
                <mask id="irisMask">
                  <rect width="320" height="320" fill="#000"/>
                  <circle cx="160" cy="160" r="155" fill="#fff"/>
                  <polygon class="iris-hole" points="160,130 186,145 186,175 160,190 134,175 134,145" fill="#000"/>
                </mask>
              </defs>
              <circle class="aperture-glass" cx="160" cy="160" r="155"/>
              <g class="iris-assembly" mask="url(#irisMask)">
                <circle class="iris-disc" cx="160" cy="160" r="155"/>
                <g class="iris-seams">
                  <path class="iris-seam" d="M160 5C221 21 258 74 235 128C225 150 205 162 181 166"/>
                  <path class="iris-seam" d="M160 5C221 21 258 74 235 128C225 150 205 162 181 166" transform="rotate(60 160 160)"/>
                  <path class="iris-seam" d="M160 5C221 21 258 74 235 128C225 150 205 162 181 166" transform="rotate(120 160 160)"/>
                  <path class="iris-seam" d="M160 5C221 21 258 74 235 128C225 150 205 162 181 166" transform="rotate(180 160 160)"/>
                  <path class="iris-seam" d="M160 5C221 21 258 74 235 128C225 150 205 162 181 166" transform="rotate(240 160 160)"/>
                  <path class="iris-seam" d="M160 5C221 21 258 74 235 128C225 150 205 162 181 166" transform="rotate(300 160 160)"/>
                </g>
              </g>
            </svg>
            <span class="lens-reflection"></span>
          </div>
        </div>
      </div>
  </div>
</template>
<style scoped>
    /* B — Camera shutter */
    .camera-scene { display: grid; place-items: center; background: transparent; pointer-events:none; }
    .camera-exit { width:min(42vw,360px); aspect-ratio:1.48; }
    .camera-wrap { position: relative; width:100%; aspect-ratio: 1.48; opacity: 0; transform: translateY(14px) scale(.96); animation:camera-arrive 340ms cubic-bezier(.17,.82,.22,1) both; }
    @keyframes camera-arrive { to { opacity: 1; transform: translateY(0) scale(1); } }
    .camera-scene[data-camera-phase="revealing"] .camera-exit { animation: camera-dismiss 400ms cubic-bezier(.4,0,.3,1) 650ms both; }
    @keyframes camera-dismiss { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(-10px) scale(.98); } }
    .camera-body { position: absolute; z-index: 1; inset: 20% 3% 0; overflow: hidden; border: 1px solid #50544f; border-radius: 20px 20px 38px 38px; background: linear-gradient(180deg,#292e29 0%,#171b18 100%); box-shadow: none; }
    .camera-body::before { display: none; }
    .camera-body::after { position: absolute; top: 30px; right: 26px; width: 8%; aspect-ratio: 1; border: 1px solid #555a54; border-radius: 50%; background: radial-gradient(circle,#101512 0 28%,#303630 31% 54%,#0c100e 57%); content: ""; }
    .camera-grip { position: absolute; z-index: 3; top: 20%; bottom: 0; left: -3%; width: 31%; border: 1px solid #4a4f49; border-radius: 30px 16px 30px 58px; background: radial-gradient(circle at 2px 2px,rgba(255,255,255,.075) 0 1px,transparent 1.5px) 0 0/6px 6px,linear-gradient(105deg,#0d110e,#2c312c 58%,#171b18); box-shadow: none; transform: perspective(300px) rotateY(-7deg) translateX(-4px); }
    .camera-grip::before, .camera-grip::after { display: none; }
    .camera-top { position: absolute; z-index: 0; top: 0; left: 34%; width: 42%; height: 34%; clip-path: polygon(8% 100%,22% 12%,78% 12%,92% 100%); background: linear-gradient(180deg,#292e29 0%,#171b18 100%); filter: none; }
    .camera-top::before { position: absolute; top: 0; left: 35%; width: 30%; height: 12%; border-radius: 4px 4px 1px 1px; background: repeating-linear-gradient(90deg,#171b18 0 4px,#4a504a 4px 6px); content: ""; }
    .viewfinder { position: absolute; z-index: 3; top: 8%; left: 55%; width: 10%; height: 4%; border: 2px solid #171b18; border-radius: 3px; background: #303630; box-shadow: 0 0 0 1px #686d66; transform: translateX(-50%); }
    .dial { position: absolute; z-index: 4; top: 13.2%; left: 20%; width: 13%; aspect-ratio: 3; border: 1px solid #5b6059; border-radius: 7px 7px 2px 2px; background: repeating-linear-gradient(90deg,#171b18 0 5px,#4a504a 5px 7px); }
    .dial::after { position: absolute; right: 7%; bottom: -8px; left: 7%; height: 8px; border-right: 1px solid #454a45; border-left: 1px solid #454a45; background: linear-gradient(180deg,#262b27,#1a1f1b); content: ""; }
    .shutter-button { position: absolute; z-index: 5; top: 16.5%; left: 8%; width: 7%; aspect-ratio: 3.1; border: 1px solid #666b65; border-radius: 999px 999px 3px 3px; background: linear-gradient(#d0d0ca,#747873 48%,#252a26 49%); box-shadow: none; transform: rotate(-2deg); transform-origin: bottom; }
    .camera-scene[data-camera-phase="revealing"] .shutter-button { animation: shutter-press 360ms cubic-bezier(.3,.75,.2,1) 80ms both; }
    @keyframes shutter-press { 0%,100% { transform: translateY(0) rotate(-2deg); } 32%,58% { transform: translateY(3px) rotate(-2deg) scaleY(.72); } }
    .lens { position: absolute; z-index: 4; top: 61%; left: 55%; width: 47%; aspect-ratio: 1; overflow: hidden; border: 14px solid #080b09; border-radius: 50%; background: radial-gradient(circle at 43% 37%,rgba(99,156,143,.18) 0 8%,rgba(16,45,38,.2) 27%,rgba(3,9,7,.32) 69%,rgba(0,0,0,.46) 100%); box-shadow: 0 0 0 3px #62665f,0 0 0 9px #1d221e; backdrop-filter: blur(1.2px) brightness(.82); transform: translate(-50%,-50%); }
    .lens::before { position: absolute; z-index: 4; inset: 4%; border: 1px solid rgba(255,255,255,.17); border-radius: 50%; content: ""; pointer-events: none; }
    .lens::after { position: absolute; z-index: 5; inset: 2%; border-radius: 50%; background: linear-gradient(145deg,rgba(213,244,235,.13),transparent 28% 68%,rgba(70,114,104,.1)),radial-gradient(circle at 31% 24%,rgba(228,250,243,.18),transparent 11%); box-shadow: inset 0 0 22px rgba(174,219,207,.08); content: ""; pointer-events: none; }
    .aperture-svg { position: absolute; z-index: 2; inset: 0; width: 100%; height: 100%; overflow: visible; }
    .aperture-glass { fill: url(#glassGradient); opacity: .48; }
    .iris-disc { fill: url(#bladeGradient); }
    .iris-seams { transform: rotate(-28deg); transform-box: view-box; transform-origin: 160px 160px; }
    .iris-seam { fill: none; stroke: rgba(184,192,185,.72); stroke-width: 1.65; stroke-linecap: round; }
    .iris-hole { transform: rotate(-28deg) scale(6.2); transform-box: view-box; transform-origin: 160px 160px; }
    .camera-scene[data-camera-phase="revealing"] .iris-seams { animation: iris-turn 420ms cubic-bezier(.56,.02,.28,1) 160ms both; }
    .camera-scene[data-camera-phase="revealing"] .iris-hole { animation: iris-close 420ms cubic-bezier(.56,.02,.28,1) 160ms both; }
    @keyframes iris-turn { 0%,100% { transform: rotate(-28deg); } 42%,62% { transform: rotate(0); } }
    @keyframes iris-close { 0%,100% { transform: rotate(-28deg) scale(6.2); } 18% { transform: rotate(-22deg) scale(5.3); } 42%,62% { transform: rotate(0) scale(1); } 82% { transform: rotate(-28deg) scale(6.2); } }
    .lens-reflection { position: absolute; z-index: 6; top: 25%; left: 26%; width: 15%; height: 8%; border-radius: 50%; background: rgba(220,247,239,.3); transform: rotate(-28deg); filter: blur(3px); }


.camera-scene { position: absolute; inset: 0; overflow: hidden; }
@media(max-width:720px){ .camera-exit{width:min(66vw,270px)}.lens{border-width:8px} }
</style>
