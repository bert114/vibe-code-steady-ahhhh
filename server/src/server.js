// Entry point. Imports env.js first so startup guards run before anything listens.
import { createApp } from "./app.js";
import "./config/env.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(
    `[server] Steady-Ahh API listening on sauahsuhsuh uhsuhsuah  :${env.PORT} (${env.NODE_ENV})`,
  );
});
