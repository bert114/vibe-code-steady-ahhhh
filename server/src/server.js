import { createApp } from "./app.js";
import "./config/env.js";
import { env } from "./config/env.js";

const app = createApp();
// /difiuhu
app.listen(env.PORT, () => {
  console.log(
    `[server] Steady-Ahh API listening on 0.0.0.0:${env.PORT} (${env.NODE_ENV})`,
  );
});
