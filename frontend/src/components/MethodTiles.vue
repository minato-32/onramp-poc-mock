<script setup lang="ts">
import { computed } from 'vue';
import { useOnramp } from '../composables/useOnramp';

const { state, pickMethod } = useOnramp();
const info = (t: string) => state.availability?.methods.find((m) => m.type === t);
const available = (t: string) => !state.availability || !!info(t); // unknown availability -> allow
const bank = computed(() => info('BANK_TRANSFER'));
const card = computed(() => info('CARD'));
</script>

<template>
  <section class="card">
    <h2>How do you want to pay? <small>{{ state.country }} · {{ state.fiat }}</small></h2>
    <p v-if="state.availability && !state.availability.available" class="warn">
      {{ state.token }} isn't directly deliverable in {{ state.country }} — try another region or a token that needs a bridge.
    </p>
    <div class="tiles">
      <button class="tile" :disabled="!available('BANK_TRANSFER')" @click="pickMethod('BANK_TRANSFER')">
        <span>🏦 Bank transfer</span>
        <small v-if="bank">via {{ bank.providers.join(', ') }} · {{ bank.min }}–{{ bank.max }} {{ bank.currency }}</small>
      </button>
      <button class="tile" :disabled="!available('CARD')" @click="pickMethod('CARD')">
        <span>💳 Card</span>
        <small v-if="card">via {{ card.providers.join(', ') }} · {{ card.min }}–{{ card.max }} {{ card.currency }}</small>
      </button>
    </div>
    <button class="btn secondary" @click="state.step = 'region'">← Back</button>
  </section>
</template>
