const app = require("./app");
const port = Number(process.env.PORT) || 5000;

app.listen(port, "0.0.0.0", () =>
  console.log(`CloudCart API listening on 0.0.0.0:${port}`),
);
