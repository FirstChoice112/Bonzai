const { docClient, DeleteCommand, GetCommand } = require("../config/config.js");
const { checkDaysBetweenDates } = require("./validateServices.js");

// Deletes a booking based on the provided booking ID if it meets the date criteria
const deleteBooking = async (bookingId) => {
  // Fetch booking details based on booking ID
  const getBookingDate = new GetCommand({
    TableName: process.env.BOOKING_TABLE,
    Key: { bookingId },
  });

  const { Item: item } = await docClient.send(getBookingDate);

  if (!item) {
    return { response: "Booking not found" };
  }

  // Check the number of days between the booking date and today
  const datediff = checkDaysBetweenDates(item.bookingDate);
  if (datediff < 2) {
    return { response: "Cancellation not allowed, insufficient time." };
  }

  // Delete the booking if the date difference condition is met
  const deleteBooking = new DeleteCommand({
    TableName: process.env.BOOKING_TABLE,
    Key: { bookingId },
  });

  const response = await docClient.send(deleteBooking);
  return response;
};

module.exports = { deleteBooking };
