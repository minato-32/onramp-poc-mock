<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLog } from '../composables/useLog';

const { entries, clearLog } = useLog();
const open = ref(true);

const label: Record<string, string> = {
  call: 'REQ',
  ok: 'OK',
  err: 'ERR',
  step: 'STEP',
  info: 'INFO',
};
const count = computed(() => entries.length);
</script>

<template>
  <section class="console" :class="{ closed: !open }">
    <header class="bar" @click="open = !open">
      <span class="dot" />
      <strong>Activity log</strong>
      <span class="muted">{{ count }} events</span>
      <span class="spacer" />
      <button class="mini" @click.stop="clearLog">clear</button>
      <button class="mini" @click.stop="open = !open">{{ open ? '▾ hide' : '▴ show' }}</button>
    </header>

    <ol v-show="open" class="lines">
      <li v-for="e in entries" :key="e.id" :class="e.level">
        <span class="t">{{ e.time }}</span>
        <span class="lvl">{{ label[e.level] }}</span>
        <span class="msg">{{ e.msg }}</span>
        <span v-if="e.ms != null" class="ms">{{ e.ms }}ms</span>
        <span v-if="e.detail" class="detail">{{ e.detail }}</span>
      </li>
      <li v-if="!entries.length" class="empty">No activity yet — pick a region to start.</li>
    </ol>
  </section>
</template>

<style scoped>
.console {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  background: #0b0d12;
  border-top: 1px solid #262b36;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.4);
}
.bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  cursor: pointer;
  color: #cdd3df;
  user-select: none;
}
.bar strong { font-weight: 600; }
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 6px #22c55e;
}
.muted { color: #6b7280; }
.spacer { flex: 1; }
.mini {
  background: #1b1f27;
  border: 1px solid #2b313c;
  color: #aab1bd;
  border-radius: 6px;
  padding: 2px 8px;
  cursor: pointer;
  font: inherit;
}
.mini:hover { background: #232833; }
.lines {
  list-style: none;
  margin: 0;
  padding: 4px 0 8px;
  max-height: 34vh;
  overflow-y: auto;
}
.lines li {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 3px 14px;
  white-space: nowrap;
  border-top: 1px solid #14171d;
}
.lines li .t { color: #4b5563; }
.lines li .lvl {
  width: 40px;
  font-weight: 700;
  flex-shrink: 0;
}
.lines li .msg { color: #d7dce5; }
.lines li .ms { color: #6b7280; }
.lines li .detail {
  color: #8b93a1;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lines li.call .lvl { color: #60a5fa; }
.lines li.ok .lvl { color: #22c55e; }
.lines li.err .lvl { color: #f87171; }
.lines li.err .msg { color: #fca5a5; }
.lines li.step .lvl { color: #c084fc; }
.lines li.step .msg { color: #e9d5ff; }
.lines li.info .lvl { color: #eab308; }
.empty { color: #6b7280; justify-content: center; }
</style>
