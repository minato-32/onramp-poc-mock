<script setup lang="ts">
import { computed, ref } from 'vue';
import { useOnramp } from '../composables/useOnramp';
import type { Country } from '../types';

const { state, pickCountry } = useOnramp();
const search = ref('');
const list = computed<Country[]>(() => {
  const q = search.value.trim().toLowerCase();
  const all = state.countries;
  if (!q) return all.slice(0, 60);
  return all.filter((c) => c.name.toLowerCase().includes(q) || c.countryCode.toLowerCase().includes(q)).slice(0, 60);
});
</script>

<template>
  <section class="card">
    <h2>Where's your bank?</h2>
    <input v-model="search" class="input" placeholder="Search country…" />
    <div class="grid">
      <button v-for="c in list" :key="c.countryCode" class="country" @click="pickCountry(c)">
        <img v-if="c.flag" :src="c.flag" alt="" width="20" height="14" />
        {{ c.name }} <span class="cc">{{ c.countryCode }}</span>
      </button>
    </div>
  </section>
</template>
