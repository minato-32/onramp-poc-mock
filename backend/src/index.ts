import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { onrampRouter } from './routes/onramp.js';
import { coinageRouter } from './routes/coinage.js';

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use('/api/onramp', onrampRouter);
app.use('/api/coinage', coinageRouter);

app.listen(config.port, () => {
  console.log(`[onramp-poc-mock backend] http://localhost:${config.port}`);
  console.log(`  mode: ${config.mock ? 'MOCK (no Meld key — full flow runs locally)' : 'LIVE'} · meld ${config.meldEnv}`);
});
