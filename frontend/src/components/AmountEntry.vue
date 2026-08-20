<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useOnramp } from '../composables/useOnramp';
import { onrampApi } from '../services/api';
import { TARGET_TOKENS } from '../utils/assethub-codes';
import { fiatFor } from '../utils/country-fiat';
import QuoteSummary from './QuoteSummary.vue';

const { state, getQuote } = useOnramp();

// Region's local currency (informational). Charge stays in USD.
const localFiat = computed(() => fiatFor(state.country));
const rate = ref<number | null>(null);
const asOf = ref<number | null>(null);
const fxError = ref('');
const fxLoading = ref(false);

const showFx = computed(() => localFiat.value !== state.fiat); // hide when local == USD
const localAmount = computed(() =>
  rate.value != null ? (Number(state.amount) || 0) * rate.value : null,
);
const asOfLabel = computed(() =>
  asOf.value ? new Date(asOf.value).toLocaleTimeString() : '',
);

onMounted(async () => {
  if (!showFx.value) return;
  fxLoading.value = true;
  try {
    const r = await onrampApi.fx(localFiat.value);
    rate.value = r.rate;
    asOf.value = r.asOf;
  } catch (e) {
    fxError.value = (e as Error).message;
  } finally {
    fxLoading.value = false;
  }
});
</script>

<template>
  <section class="card">
    <h2>How much do you want to spend?</h2>
    <div class="amount-grid">
      <div class="amount-main">
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
      </div>

      <!-- live region-local conversion (informational only) -->
      <aside v-if="showFx" class="fx">
        <div class="fx-label">In {{ state.country }} that's about</div>
        <div v-if="fxLoading" class="fx-big muted">…</div>
        <div v-else-if="fxError" class="fx-err">FX unavailable</div>
        <template v-else-if="localAmount != null">
          <div class="fx-big">{{ localAmount.toLocaleString(undefined, { maximumFractionDigits: 2 }) }} {{ localFiat }}</div>
          <div class="fx-rate">1 {{ state.fiat }} = {{ rate!.toFixed(4) }} {{ localFiat }}</div>
          <div class="fx-asof">live · {{ asOfLabel }}</div>
        </template>
      </aside>
    </div>

    <QuoteSummary v-if="state.quote" />
    <div class="row" v-else>
      <button v-if="!state.methodLocked" class="btn secondary" @click="state.step = 'method'">← Back</button>
      <button class="btn" :disabled="state.loading" @click="getQuote">{{ state.loading ? '…' : 'Get quote' }}</button>
    </div>
  </section>
</template>

<style scoped>
.amount-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 18px;
  align-items: start;
}
.amount-main { min-width: 0; }
.fx {
  background: #12151c;
  border: 1px solid #262b36;
  border-radius: 10px;
  padding: 14px 16px;
  min-width: 190px;
  text-align: right;
}
.fx-label {
  font-size: 12px;
  color: #8b93a1;
  margin-bottom: 6px;
}
.fx-big {
  font-size: 22px;
  font-weight: 700;
  color: #e9d5ff;
}
.fx-rate {
  font-size: 12px;
  color: #aab1bd;
  margin-top: 6px;
}
.fx-asof {
  font-size: 11px;
  color: #22c55e;
  margin-top: 2px;
}
.fx-err { color: #f87171; font-size: 13px; }
@media (max-width: 640px) {
  .amount-grid { grid-template-columns: 1fr; }
  .fx { text-align: left; }
}
</style>
