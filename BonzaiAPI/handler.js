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
const {
  validateDate,
  validateRoomTypes,
  checkBookingId,
  checkValidUpdates,
  checkValidDataType,
} = require("./services/validateServices");
const { bookRooms } = require("./services/bookRooms");
const { updateBooking } = require("./services/updateBooking");
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
  console.error(`Error: ${message}`, error);
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

    console.log("Request body received:", req.body);

    const isValidInDate = validateDate(inDate);
    const isValidOutDate = validateDate(outDate);

    if (!isValidInDate || !isValidOutDate) {
      console.error("Invalid date format provided:", { inDate, outDate });
      return res
        .status(400)
        .json({ message: "Invalid date format, yyyy-mm-dd is required" });
    }

    const isValidRoomTypes = validateRoomTypes(rooms);
    if (!isValidRoomTypes) {
      console.error("Invalid room type provided:", rooms);
      return res.status(400).json({
        message: "Invalid room type. Choose Single, Double, or Suite.",
      });
    }

    const isValid = checkValidDataType(req);
    if (!isValid) {
      console.error("Invalid data types in the request body:", req.body);
      return res.status(400).json({
        message: "All fields are required",
        typeSpec: {
          name: "string",
          email: "string",
          inDate: "string",
          outDate: "YYYY-MM-DD",
          totalGuests: "number",
          rooms: "array",
        },
      });
    }

    const placeholder = {
      bookingId: uuid,
      name,
      email,
      inDate,
      outDate,
      totalGuests,
      rooms,
    };

    const response = await bookRooms(placeholder);

    console.log("Booking request placeholder:", placeholder);
    console.log("Response from bookRooms:", response);

    if (!response.success) {
      console.error("Booking failed with response:", response);
      return res.status(400).json({
        data: response,
        success: response.success,
        message: response.message,
      });
    }

    console.log("Booking successful with response:", response);
    res.status(200).json({ data: response });
  } catch (error) {
    console.error("Error occurred during room booking:", error);
    handleError(res, error);
  }
});

// @route       PUT /update
// @desc        Update an existing booking
// @access      Public (or Private if authentication is required)

app.put("/update", async (req, res) => {
  try {
    const { bookingId, updates } = req.body;
    console.log(
      `Request to update booking ID: ${bookingId} with updates:`,
      updates
    );

    const booking = await checkBookingId(bookingId);
    if (!booking) {
      console.error(`Booking not found for ID: ${bookingId}`);
      return res.status(400).json({ message: "Booking could not be found" });
    }

    const isValidUpdates = checkValidUpdates(updates);
    if (!isValidUpdates) {
      console.error(
        `Invalid updates provided for booking ID: ${bookingId}`,
        updates
      );
      return res.status(400).json({
        message: "Invalid data types",
        validDataTypes: {
          inDate: "YYYY-MM-DD",
          outDate: "YYYY-MM-DD",
          totalGuests: "number",
          rooms: ["suite", "double", "single"],
        },
      });
    }

    const response = await updateBooking(booking, updates);
    console.log(`Booking update successful for ID: ${bookingId}`, response);

    return res.status(200).json({ msg: "UPDATE OK!" });
  } catch (error) {
    console.error("Error occurred during booking update:", error);
    return handleError(res, error, 500, "No, cannot update");
  }
});

// Handle unknown routes with 404 error
app.use((req, res) => {
  console.error(`Route not found: ${req.originalUrl}`);
  res.status(404).json({ error: "Not Found" });
});

exports.handler = serverless(app);
