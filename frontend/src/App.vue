<script setup lang="ts">
import { onMounted } from 'vue';
import { useOnramp } from './composables/useOnramp';
import RegionSelect from './components/RegionSelect.vue';
import MethodTiles from './components/MethodTiles.vue';
import AmountEntry from './components/AmountEntry.vue';
import PayPanel from './components/PayPanel.vue';
import CoinageProgress from './components/CoinageProgress.vue';
import LogConsole from './components/LogConsole.vue';

const { state, init } = useOnramp();
onMounted(init);

const STEPS = ['region', 'method', 'amount', 'pay', 'coinage', 'done'];
const stepIdx = (s: string) => STEPS.indexOf(s);
</script>

<template>
  <div class="wrap">
    <header class="head">
      <h1>On-Ramp <span class="tag">PoC</span></h1>
      <span class="env">mode: {{ state.mode }} · Meld via API (no widget)</span>
    </header>

    <ol class="stepper">
      <li v-for="s in STEPS" :key="s" :class="{ on: stepIdx(s) <= stepIdx(state.step) }">{{ s }}</li>
    </ol>

    <p v-if="state.error" class="err">{{ state.error }}</p>

    <RegionSelect v-if="state.step === 'region'" />
    <MethodTiles v-else-if="state.step === 'method'" />
    <AmountEntry v-else-if="state.step === 'amount'" />
    <PayPanel v-else-if="state.step === 'pay'" />
    <CoinageProgress v-else-if="state.step === 'coinage' || state.step === 'done'" />
  </div>

  <LogConsole />
</template>

<style scoped>
.wrap { padding-bottom: 40vh; }
</style>
