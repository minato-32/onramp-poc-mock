<script setup lang="ts">
import { useOnramp } from '../composables/useOnramp';
import { TARGET_TOKENS } from '../utils/assethub-codes';
import QuoteSummary from './QuoteSummary.vue';

const { state, getQuote } = useOnramp();
</script>

<template>
  <section class="card">
    <h2>How much do you want to spend?</h2>
    <label class="lbl">
      Amount to spend ({{ state.fiat }})
      <span v-if="state.amountLocked" class="badge">from link</span>
    </label>
    <div class="row">
      <input
        v-model.number="state.amount"
        type="number"
        min="1"
        class="input amount"
        :readonly="state.amountLocked"
      />
      <select v-model="state.token" class="input">
        <option v-for="t in TARGET_TOKENS" :key="t.code" :value="t.code">{{ t.label }}</option>
      </select>
    </div>
    <p class="muted small">
      {{ state.country }} · {{ state.method }}<span v-if="state.methodLocked"> (from link)</span> ·
      pay in {{ state.fiat }} · delivered to a per-session ephemeral Asset Hub address
    </p>

    <QuoteSummary v-if="state.quote" />
    <div class="row" v-else>
      <button v-if="!state.methodLocked" class="btn secondary" @click="state.step = 'method'">← Back</button>
      <button class="btn" :disabled="state.loading" @click="getQuote">{{ state.loading ? '…' : 'Get quote' }}</button>
    </div>
  </section>
</template>
