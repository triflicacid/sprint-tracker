import { initSchema } from "./db/connection.js";
import { createApp } from "./app.js";

initSchema();

const app = createApp();

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
    console.log(`sprint tracker server listening on port ${port}`);
});
