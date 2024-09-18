//Marcus (ändra eller ta bort vad ni vill)

// Import required AWS SDK commands for interacting with DynamoDB
const {
  DynamoDBDocumentClient,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");

// Import utility functions for validation (date and room types)
const { validateDate } = require("./services/validateDate");
const { validateRoomTypes } = require("./services/validateRooms");

// Import the client configuration for connecting to DynamoDB
const { client } = require("../config/config.js");

// Create a document client instance to work with DynamoDB
const docClient = DynamoDBDocumentClient.from(client);

// Function to validate booking data
const validateBookingData = (bookingDetails) => {
  const { name, email, inDate, outDate, totalGuests, rooms } = bookingDetails;

  if (!name || !email || !totalGuests || !Array.isArray(rooms)) {
    return createErrorResponse("Invalid input data. Please check all fields.");
  }

  if (!validateDate(inDate) || !validateDate(outDate)) {
    return createErrorResponse(
      "Invalid date format. Format must be YYYY-MM-DD."
    );
  }

  if (!validateRoomTypes(rooms)) {
    return createErrorResponse(
      "Invalid room type. Choose Single, Double, or Suite."
    );
  }

  return { success: true };
};

// Helper function to create an error response
const createErrorResponse = (message) => ({
  success: false,
  message,
});

// Function to create the DynamoDB UpdateCommand
const createUpdateCommand = (bookingDetails) => {
  const { bookingId, name, email, inDate, outDate, totalGuests, rooms } =
    bookingDetails;

  return new UpdateCommand({
    TableName: process.env.BOOKING_TABLE,
    Key: { bookingId },
    UpdateExpression:
      "SET #n = :name, #e = :email, #in = :inDate, #out = :outDate, #guests = :totalGuests, #r = :rooms",
    ExpressionAttributeNames: {
      "#n": "name",
      "#e": "email",
      "#in": "inDate",
      "#out": "outDate",
      "#guests": "totalGuests",
      "#r": "rooms",
    },
    ExpressionAttributeValues: {
      ":name": name,
      ":email": email,
      ":inDate": inDate,
      ":outDate": outDate,
      ":totalGuests": totalGuests,
      ":rooms": rooms,
    },
    ReturnValues: "ALL_NEW",
  });
};

// Function to handle the update request
const updateBookings = async (req, res) => {
  const bookingDetails = req.body;

  const validation = validateBookingData(bookingDetails);
  if (!validation.success) {
    return res.status(400).json(validation);
  }

  return await executeUpdate(bookingDetails, res);
};

// Helper function to execute the DynamoDB update
const executeUpdate = async (bookingDetails, res) => {
  const command = createUpdateCommand(bookingDetails);

  const response = await tryUpdate(command);
  if (!response.success) {
    return res.status(500).json({
      success: false,
      message: "Error updating booking",
      error: response.error,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Booking updated successfully",
    updatedItem: response.data,
  });
};

// Helper function to attempt the DynamoDB update and handle errors
const tryUpdate = async (command) => {
  try {
    const response = await docClient.send(command);
    return { success: true, data: response.Attributes };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { updateBookings };
