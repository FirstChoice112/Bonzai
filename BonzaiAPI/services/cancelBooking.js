const {
  docClient,
  DeleteCommand,
  UpdateCommand,
} = require("../config/config.js");

// Deletes a booking based on the provided booking ID if it meets the date criteria
// Set booked rooms from false to true
const cancelBooking = async (booking, bookingId) => {
  try {
    console.log(`Attempting to delete booking with ID: ${bookingId}`);

    const idString = bookingId.toString();
    const command = new DeleteCommand({
      TableName: process.env.BOOKING_TABLE,
      Key: { bookingId: idString },
    });

    const response = await docClient.send(command);

    for (let i = 0; i < booking.rooms.length; i++) {
      const room = booking.rooms[i];
      const idString = room.toString();
      try {
        const updateRoomCommand = new UpdateCommand({
          TableName: process.env.ROOMS_TABLE,
          Key: { roomId: idString },
          UpdateExpression: "SET availableStatus = :availableStatus",
          ExpressionAttributeValues: { ":availableStatus": "true" },
          ReturnValues: "ALL_NEW",
        });

        const response = await docClient.send(updateRoomCommand);
      } catch (error) {
        console.log("Failed to update rooms.", error);
      }
    }
    return {
      success: true,
      message: "Booking successfully deleted",
    };
  } catch (error) {
    console.log(error);
  }
};

module.exports = { cancelBooking };
