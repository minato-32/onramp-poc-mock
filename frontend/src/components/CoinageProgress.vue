<script setup lang="ts">
import { computed } from 'vue';
import { useOnramp } from '../composables/useOnramp';

const { state, reset } = useOnramp();
const PHASES: Array<[string, string]> = [
  ['awaiting-deposit', 'Deposit received on ephemeral address'],
  ['swapping', 'Swap DOT → CASH (Asset Hub)'],
  ['moving', 'XCM: CASH → People chain'],
  ['topping-up', 'topUp() → coinage'],
  ['done', 'Coinage credited'],
];
const idx = computed(() => PHASES.findIndex((p) => p[0] === state.coinage?.phase));
const allDone = computed(() => state.coinage?.phase === 'done');
</script>

<template>
  <section class="card">
    <h2>Delivering to coinage</h2>
    <p class="muted small">Native DOT on the ephemeral address → host swap → CASH → People → topUp → coinage (mock).</p>
    <ol class="phases">
      <li v-for="(p, i) in PHASES" :key="p[0]" :class="{ done: i < idx || allDone, active: i === idx && !allDone }">
        <span class="pdot"></span> {{ p[1] }}
      </li>
    </ol>
    <p v-if="state.step === 'done'" class="ok">✅ {{ state.coinage?.coinageCredited }} CASH credited as coinage.</p>
    <button class="btn secondary" @click="reset">Start over</button>
  </section>
</template>
