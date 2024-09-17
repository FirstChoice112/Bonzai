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
const { validateDate } = require("./services/validateDate");
const { bookRooms } = require("./services/bookRooms");
const express = require("express");
const serverless = require("serverless-http");

const app = express();

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);
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

// POST route

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
      return res.status(400).json({ message: "invalid dateformat" });
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

    const response = bookRooms(placeholder);

    console.log("placeholder", placeholder);
    console.log(response);
  } catch (error) {}
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

  if (typeof inDate !== "string") {
    console.log("indate smäller", typeof inDate);
    return false;
  }
  if (typeof outDate !== "string") {
    console.log("outdate smäller", typeof outDate);
    return false;
  }
  if (typeof totalGuests !== "number") {
    console.log("toalguest smäller", typeof totalGuests);
    return false;
  }

  if (typeof rooms !== "object") {
    console.log("rooms smäller", typeof rooms);
    return false;
  }

  if (rooms.length === 0) {
    console.log(rooms);
    console.log("length", typeof rooms.length);
    return false;
  } else return true;
};

app.use((req, res) => res.status(404).json({ error: "Not Found" }));

exports.handler = serverless(app);

// postman postbooking
//{
//   "name": "John Doe",
//   "email": "john.doe@example.com",
//   "inDate": "2024-01-16",
//   "outDate": "2024-01-20",
//   "totalGuests": 2,
//   "rooms": [
//     { "roomType": "suite", "quantity": 1 },
//     { "roomType": "single", "quantity": 1 }
//   ]
// }
