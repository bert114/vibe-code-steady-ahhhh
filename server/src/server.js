import { createApp } from "./app.js";
import "./config/env.js";
import { env } from "./config/env.js";
import { testConnection } from "./db/pool.js";

const app = createApp();

app.listen(env.PORT, async () => {
  console.log(
    `[server] Steady-Ahh API listening on 0.0.0.0:${env.PORT} (${env.NODE_ENV})`,
  );
  await testConnection();
});

