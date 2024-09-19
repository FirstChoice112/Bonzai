//Marcus

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
const express = require("express");
const serverless = require("serverless-http");

const app = express();

// Initialize DynamoDB client and document client
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

// Utility function for error handling
const handleError = (
  res,
  error,
  statusCode = 500,
  message = "Internal Server Error"
) => {
  console.error(`Error: ${message}`, error);
  res.status(statusCode).json({ error: message });
};

// @route       GET /getbooking/{bookingId}
// @desc        Retrieve booking details by bookingId
// @access      Public (or Private if authentication is required)
app.get("/getbooking/:bookingId", async (req, res) => {
  const { bookingId } = req.params;

  // Validate the bookingId parameter
  if (!bookingId) {
    console.error("Booking ID is required but not provided.");
    return res.status(400).json({ message: "Booking ID is required" });
  }

  try {
    console.log(`Fetching booking with ID: ${bookingId}`);
    const command = new GetCommand({
      TableName: process.env.BOOKING_TABLE,
      Key: { bookingId },
    });

    const response = await docClient.send(command);

    // Check if the booking exists
    if (!response.Item) {
      console.error(`Booking not found for ID: ${bookingId}`);
      return res.status(404).json({ message: "Booking not found" });
    }

    console.log(`Booking found for ID: ${bookingId}`, response.Item);
    res.status(200).json({ data: response.Item });
  } catch (error) {
    console.error(`Error fetching booking with ID: ${bookingId}`, error);
    handleError(res, error);
  }
});

// Fallback route for unknown endpoints
app.use((req, res) => {
  console.error(`Route not found: ${req.originalUrl}`);
  res.status(404).json({ error: "Not Found" });
});

exports.handler = serverless(app);
