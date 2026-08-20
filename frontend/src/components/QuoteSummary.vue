<script setup lang="ts">
import { useOnramp } from '../composables/useOnramp';

const { state, startPay } = useOnramp();
</script>

<template>
  <div class="quote" v-if="state.quote">
    <p class="big">
      Pay <strong>{{ state.quote.charge.toFixed(2) }} {{ state.quote.fiat }}</strong>
      → receive <strong>≈ {{ state.quote.receiveAmount.toFixed(6) }} {{ state.quote.targetToken }}</strong>
    </p>
    <ul class="fees">
      <li>via {{ state.quote.serviceProvider }} <span v-if="state.quote.mock" class="badge">mock</span></li>
      <li>rate: 1 {{ state.quote.fiat }} ≈ {{ state.quote.breakdown.exchangeRate }} {{ state.quote.targetToken }}</li>
      <li>total fee: {{ state.quote.breakdown.totalFee }} · network: {{ state.quote.breakdown.networkFee }}</li>
    </ul>
    <div class="row">
      <button class="btn secondary" @click="state.quote = null">← Change</button>
      <button class="btn" :disabled="state.loading" @click="startPay">
        Pay {{ state.quote.charge.toFixed(2) }} {{ state.quote.fiat }}
      </button>
    </div>
  </div>
</template>
