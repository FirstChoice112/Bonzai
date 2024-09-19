const {
  docClient,
  DeleteCommand,
  UpdateCommand,
} = require("../config/config.js");

// Deletes a booking based on the provided booking ID if it meets the date criteria
const cancelBooking = async (booking, bookingId) => {
  try {
    console.log(`Attempting to delete booking with ID: ${bookingId}`);

    const idString = bookingId.toString();
    const command = new DeleteCommand({
      TableName: process.env.BOOKING_TABLE,
      Key: { bookingId: idString },
    });

    const response = await docClient.send(command);
    console.log("deletereresponse", response);

    for (let i = 0; i < booking.rooms.length; i++) {
      const room = booking.rooms[i];
      const idString = room.toString();
      try {
        console.log("PROCESSING ROOM", room);

        const updateRoomCommand = new UpdateCommand({
          TableName: process.env.ROOMS_TABLE,
          Key: { roomId: idString },
          UpdateExpression: "SET availableStatus = :availableStatus",
          ExpressionAttributeValues: { ":availableStatus": "true" },
          ReturnValues: "ALL_NEW",
        });

        const response = await docClient.send(updateRoomCommand);
        console.log("Rooms update responses", response);
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

/* 

// MARCUS 

const { docClient, DeleteCommand, UpdateCommand } = require("../config/config.js");

// Deletes a booking based on the provided booking ID and updates room availability
const cancelBooking = async ({ rooms }, bookingId) => {
  try {
    console.log(`Attempting to delete booking with ID: ${bookingId}`);

    // Delete booking
    await docClient.send(
      new DeleteCommand({
        TableName: process.env.BOOKING_TABLE,
        Key: { bookingId: bookingId.toString() },
      })
    );

    // Update room availability in parallel
    await Promise.all(
      rooms.map((roomId) =>
        docClient.send(
          new UpdateCommand({
            TableName: process.env.ROOMS_TABLE,
            Key: { roomId: roomId.toString() },
            UpdateExpression: "SET availableStatus = :availableStatus",
            ExpressionAttributeValues: { ":availableStatus": "true" },
          })
        )
      )
    );

    return { success: true, message: "Booking successfully deleted" };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, message: "Failed to delete booking." };
  }
};

module.exports = { cancelBooking };


*/
