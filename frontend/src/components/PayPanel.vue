<script setup lang="ts">
import { useOnramp } from '../composables/useOnramp';

const { state, simulatePayment, reset } = useOnramp();
</script>

<template>
  <section class="card">
    <h2>Complete your payment</h2>
    <p class="muted small">
      Deposit address (ephemeral, locked): <code>{{ state.coinage?.ephemeralAddress }}</code>
    </p>

    <!-- mock: inline simulated provider page; live: provider WebView -->
    <div v-if="state.session?.mock" class="mockpay">
      <p>
        Provider hosted page (mock). In the app this is an in-app <strong>WebView</strong> where the user enters
        card / bank details — the destination is locked to the ephemeral address (PCI boundary, so capture never
        touches our frontend).
      </p>
      <button class="btn" @click="simulatePayment">Simulate payment complete</button>
    </div>
    <template v-else>
      <iframe :src="state.session?.serviceProviderWidgetUrl" class="frame" title="Payment" referrerpolicy="no-referrer" />
      <div class="row">
        <a :href="state.session?.serviceProviderWidgetUrl" target="_blank" rel="noopener" class="btn secondary">Open in new tab</a>
        <button class="btn" @click="simulatePayment">I've paid → continue</button>
      </div>
    </template>

    <button class="btn secondary" @click="reset">Start over</button>
  </section>
</template>
