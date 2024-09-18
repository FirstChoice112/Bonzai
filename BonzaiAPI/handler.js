const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

// Set up your DynamoDB client
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");

// Import your custom services
const { validateDate } = require("./services/validateDate");
const { bookRooms } = require("./services/bookRooms");
const { validateRoomTypes } = require("./services/validateRooms");
const express = require("express");
const serverless = require("serverless-http");

const app = express();

// Initialize DynamoDB client and document client
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

// Middleware to generate a unique ID for each booking
const crypto = require("crypto");

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

app.get("/all", async (req, res) => {
  res.status(400).json({ msg: "jag gillar hestar!" });
});

// @route       POST /bookroom
// @desc        Book a room for a specified date range and guest details
// @access      Public (or Private if authentication is required)

app.post("/bookroom", async (req, res) => {
  let uuid = crypto.randomUUID();

  try {
    const { name, email, inDate, outDate, totalGuests, rooms } = req.body;
    const isValidInDate = validateDate(inDate);
    const isValidOutDate = validateDate(outDate);

    console.log("reqbody", req.body);
    if (!isValidInDate || !isValidOutDate) {
      return res
        .status(400)
        .json({ message: "invalid dateformat, yyyy-mm-dd is required" });
    }

    const isValidRoomTypes = validateRoomTypes(rooms);
    if (!isValidRoomTypes) {
      return res.status(400).json({
        message: "Invalid room type. Choose Single, Double, or Suite.",
      });
    }

    const typeSpec = {
      name: "string",
      email: "string",
      inDate: "string",
      outdate: "YYYY-MM-DD",
      totalGuests: "number",
      rooms: "array",
    };

    const isValid = checkValidDataType(req);
    console.log("isvalid", isValid);
    if (!isValid) {
      return res
        .status(400)
        .json({ message: "All fields are required", typeSpec });
    }

    const placeholder = {
      bookingId: uuid,
      name,
      email,
      inDate: inDate, // format 2024-09-17
      outDate: outDate, // format 2024-09-17
      totalGuests, // Total guest
      rooms,
    };

    const response = await bookRooms(placeholder);

    console.log("placeholder", placeholder);
    console.log("RESPONSE", response);

    if (!response.success) {
      res.status(400).json({
        data: response,
        success: response.success,
        message: response.message,
      });
    }

    res.status(200).json({ data: response });
  } catch (error) {
    console.error("ERROR", error);
    res.status(500).json({ message: "Something is wrong" });
  }
});

const checkValidDataType = (req) => {
  const { name, email, inDate, outDate, totalGuests, rooms } = req.body;

  console.log(typeof name, typeof email, typeof inDate, typeof outDate);

  if (!name || !email || !inDate || !outDate || !totalGuests || !rooms) {
    console.log("reqbody");
    return false;
  }

  if (typeof name !== "string") {
    console.log("name smäller", typeof name);
    return false;
  }

  if (typeof email !== "string") {
    console.log("mail smäller", typeof email);
    return false;
  }

  if (typeof totalGuests !== "number") {
    console.log("toalguest smäller", typeof totalGuests);
    return false;
  } else return true;
};

app.put("/update", async (req, res) => {
  try {
    const { roomId } = req.body;
    const updateRoom = new UpdateCommand({
      TableName: process.env.ROOMS_TABLE,
      Key: {
        roomId: roomId,
      },
      UpdateExpression: "set availableStatus = :availableStatus",
      ExpressionAttributeValues: {
        ":availableStatus": "false",
      },
      ReturnValues: "ALL_NEW",
    });
    return res.status(200).json({ msg: "UPDATE OK!" });
  } catch (error) {
    console.log("ERROR UPDATE IN HANDLER", error);
    return res.status(500).json({ msg: "Nej, kan inte uppdatera" });
  }
});

app.use((req, res) => res.status(404).json({ error: "Not Found" }));

exports.handler = serverless(app);
