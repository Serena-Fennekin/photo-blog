<template>
  <svg class="glass-definitions" width="0" height="0" aria-hidden="true" focusable="false">
    <defs><filter id="journal-glass-refraction" x="-5%" y="-10%" width="110%" height="120%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".012 .018" numOctaves="1" seed="8" stitchTiles="stitch" result="lens"/>
      <feDisplacementMap in="SourceGraphic" in2="lens" scale="7" xChannelSelector="R" yChannelSelector="G"/>
    </filter></defs>
  </svg>
</template>
