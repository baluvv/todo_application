const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let database = null;

const startDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log("DB Error: ${error.message}");
    process.exit(1);
  }
};

startDbAndServer();

//Get All TODO s Whose Status Is TO DO API

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  response.send(data);
});

//Get a Todo With Given Id API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
    *
    FROM todo
    WHERE id=${todoId};`;

  const todo = await database.get(getTodoQuery);
  response.send(todo);
});

//Post a Todo API
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;

  const insertTodoQuery = `
    INSERT INTO todo (id, todo, priority, status)
    VALUES (${id}, '${todo}', '${priority}', '${status}');`;
  const todoResponse = await database.run(insertTodoQuery);
  response.send("Todo Successfully Added");
});

//Update A Todo API

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  let updateTodoQuery = "";
  let updatedThing = "";

  const { status, priority, todo } = request.body;

  switch (true) {
    case status !== undefined:
      updateTodoQuery = `
          UPDATE todo
          SET status= '${status}'
          WHERE id= ${todoId};`;
      updatedThing = "Status";
      break;
    case priority !== undefined:
      updateTodoQuery = `
          UPDATE todo
          SET priority= '${priority}'
          WHERE id= ${todoId};`;
      updatedThing = "Priority";
      break;
    case todo !== undefined:
      updateTodoQuery = `
          UPDATE todo
          SET todo= '${todo}';`;
      updatedThing = "Todo";
      break;
  }
  await database.run(updateTodoQuery);
  response.send(`${updatedThing} Updated`);
});

//Delete a Todo With Id API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id= ${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
