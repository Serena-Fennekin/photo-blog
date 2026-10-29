<script setup lang="ts">
import { useId } from 'vue'
import type { CurtainPhase } from '~/composables/useRouteCurtain'

defineProps<{ phase: CurtainPhase }>()
const gradientId = `${useId()}-iris-metal`
// Each curved blade overlaps its neighbour. Inverse clips produce cyclic layering
// without leaking seams to the outer edge as the iris opens. The inner edge is
// x=.0008*y²; at full withdrawal its nearest point is1700, beyond the1415-unit
// corner of even a square viewport. No lens ring or central cutout is needed.
const blade = 'M5408 -2600Q-5408 0 5408 2600H8000V-2600Z'
const inverseBlade = `M-12000 -12000H12000V12000H-12000Z${blade}`
</script>

<template>
  <div class="aperture-scene" :data-aperture-phase="phase">
    <svg class="aperture-screen" viewBox="-1000 -1000 2000 2000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient :id="gradientId" gradientUnits="userSpaceOnUse" x1="-100" y1="-500" x2="1500" y2="650">
          <stop offset="0" class="iris-metal-tip" />
          <stop offset=".42" class="iris-metal-face" />
          <stop offset="1" class="iris-metal-edge" />
        </linearGradient>
        <clipPath v-for="leaf in 9" :id="`${gradientId}-window-${leaf}`" :key="leaf" clipPathUnits="userSpaceOnUse">
          <path class="iris-window iris-blade-motion" :style="{ '--leaf-angle': `${((leaf + 7) % 9) * 40}deg` }" :d="inverseBlade" clip-rule="evenodd" fill-rule="evenodd" />
        </clipPath>
      </defs>
      <g v-for="leaf in 9" :key="leaf" :clip-path="`url(#${gradientId}-window-${leaf})`">
        <path class="iris-leaf iris-blade-motion" :style="{ '--leaf-angle': `${(leaf - 1) * 40}deg` }" :d="blade" :fill="`url(#${gradientId})`" />
      </g>
      <circle class="iris-tipcap" r="2" />
    </svg>
  </div>
</template>

<style scoped>
.aperture-scene {
  --iris-tip:#b5c7bf; --iris-face:#dce5df; --iris-edge:#bfcfc7; --iris-seam:rgba(83,111,98,.28);
  position:absolute; inset:0; overflow:hidden; pointer-events:none;
  background:var(--iris-face);
}
:global(:root[data-theme="dark"] .aperture-scene) {
  --iris-tip:#14241d; --iris-face:#35443b; --iris-edge:#1d2d24; --iris-seam:rgba(176,195,181,.22);
}
.aperture-screen { display:block; width:100%; height:100%; }
.iris-metal-tip { stop-color:var(--iris-tip); }
.iris-metal-face { stop-color:var(--iris-face); }
.iris-metal-edge { stop-color:var(--iris-edge); }
.iris-leaf { stroke:var(--iris-seam); stroke-width:2; stroke-linejoin:round; paint-order:stroke fill; }
.iris-blade-motion { transform-box:view-box; transform-origin:0px 0px; transform:rotate(var(--leaf-angle)) rotate(0deg) translateX(0); }
.iris-tipcap { fill:var(--iris-tip); }
.aperture-scene[data-aperture-phase="revealing"] { background:transparent; }
.aperture-scene[data-aperture-phase="revealing"] .iris-blade-motion {
  animation:iris-withdraw 1100ms cubic-bezier(.45,0,.55,1) both;
}
.aperture-scene[data-aperture-phase="revealing"] .iris-tipcap { animation:iris-tip-release 1100ms linear both; }
@keyframes iris-withdraw {
  from { transform:rotate(var(--leaf-angle)) rotate(0deg) translateX(0); }
  to { transform:rotate(var(--leaf-angle)) rotate(14deg) translateX(1700px); }
}
@keyframes iris-tip-release { 0% { opacity:1; } 4%,100% { opacity:0; } }
</style>
