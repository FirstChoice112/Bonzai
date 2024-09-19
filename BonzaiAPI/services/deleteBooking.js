const { docClient, DeleteCommand, GetCommand } = require("../config/config.js");
const { checkDaysBetweenDates } = require("./validateServices.js");

// Deletes a booking based on the provided booking ID if it meets the date criteria
const deleteBooking = async (bookingId) => {
  try {
    console.log(`Attempting to fetch booking with ID: ${bookingId}`);

    // Fetch booking details based on booking ID
    const getBookingDate = new GetCommand({
      TableName: process.env.BOOKING_TABLE,
      Key: { bookingId },
    });

    const { Item: item } = await docClient.send(getBookingDate);

    // Check if the booking exists
    if (!item) {
      console.error(`Booking not found with ID: ${bookingId}`);
      return { response: "Booking not found" };
    }

    console.log(`Booking found for ID: ${bookingId}`, item);

    // Check the number of days between the booking date and today
    const datediff = checkDaysBetweenDates(item.bookingDate);
    console.log(`Days between booking date and today: ${datediff}`);

    if (datediff < 2) {
      console.error(
        `Cancellation not allowed for booking ID: ${bookingId} due to insufficient time (less than 2 days).`
      );
      return { response: "Cancellation not allowed, insufficient time." };
    }

    // Delete the booking if the date difference condition is met
    console.log(`Deleting booking with ID: ${bookingId}`);
    const deleteBooking = new DeleteCommand({
      TableName: process.env.BOOKING_TABLE,
      Key: { bookingId },
    });

    const response = await docClient.send(deleteBooking);
    console.log(`Successfully deleted booking with ID: ${bookingId}`, response);

    return response;
  } catch (error) {
    console.error(`Error deleting booking with ID: ${bookingId}`, error);
    return {
      response: "An error occurred during the booking deletion process.",
    };
  }
};

module.exports = { deleteBooking };
