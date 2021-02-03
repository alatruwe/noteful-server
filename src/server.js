const knex = require("knex");
const app = require("./app");

const { PORT, DB_URL } = require("./config");

// create knex instance
const db = knex({
  client: "pg",
  connection: DB_URL,
});

// attach knex instance to the app
app.set("db", db);

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
