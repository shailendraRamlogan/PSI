// Bootstrap: load env vars before importing the app
import { config } from "dotenv";
config({ path: new URL("../.env", import.meta.url).pathname });

const { default: app } = await import("./app.js");

const PORT = parseInt(process.env.PORT || "4000");
app.listen(PORT, () => {
  console.log(`PSI backend running on http://0.0.0.0:${PORT}`);
});
