const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");

const express = require("express");
const serverless = require("serverless-http");

const app = express();

const USERS_TABLE = process.env.USERS_TABLE;
if (!USERS_TABLE)
  throw new Error("Environment variable USERS_TABLE must be defined");

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

app.use(express.json());

const handleError = (
  res,
  error,
  statusCode = 500,
  message = "Internal Server Error"
) => {
  console.error(error);
  res.status(statusCode).json({ error: message });
};

app.get("/users/:userId", async (req, res) => {
  const { userId } = req.params;
  const params = {
    TableName: USERS_TABLE,
    Key: { userId },
  };

  try {
    const command = new GetCommand(params);
    const { Item } = await docClient.send(command);

    if (!Item)
      return res
        .status(404)
        .json({ error: `User with ID "${userId}" not found` });

    const { name } = Item;
    res.json({ userId, name });
  } catch (error) {
    handleError(res, error, 500, "Could not retrieve user");
  }
});

app.post("/users", async (req, res) => {
  const { userId, name } = req.body;

  if (typeof userId !== "string")
    return res.status(400).json({ error: '"userId" must be a string' });
  if (typeof name !== "string")
    return res.status(400).json({ error: '"name" must be a string' });

  const params = {
    TableName: USERS_TABLE,
    Item: { userId, name },
  };

  try {
    const command = new PutCommand(params);
    await docClient.send(command);
    res.json({ userId, name });
  } catch (error) {
    handleError(res, error, 500, "Could not create user");
  }
});

app.use((req, res) => res.status(404).json({ error: "Not Found" }));

exports.handler = serverless(app);
