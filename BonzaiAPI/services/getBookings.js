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
  console.error(error);
  res.status(statusCode).json({ error: message });
};

// @route       GET /getbooking/{bookingId}
// @desc        Retrieve booking details by bookingId
// @access      Public (or Private if authentication is required)
app.get("/getbooking/:bookingId", async (req, res) => {
  const { bookingId } = req.params;

  if (!bookingId) {
    return res.status(400).json({ message: "Booking ID is required" });
  }

  try {
    const command = new GetCommand({
      TableName: process.env.BOOKING_TABLE,
      Key: { bookingId },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ data: response.Item });
  } catch (error) {
    handleError(res, error);
  }
});

app.use((req, res) => res.status(404).json({ error: "Not Found" }));

exports.handler = serverless(app);
