const { docClient, DeleteCommand, GetCommand } = require("../config/config.js");
const { checkDaysBetweenDates } = require("./validateDate.js");

const deleteBooking = async (bookingid) => {
  const getBookingDate = new GetCommand({
    TableName: process.env.BOOKING_TABLE,
    Key: { bookingId },
  });

  const { Item: item } = await docClient.send(getBookingDate);

  if (!item) {
    return { response: "Booking not found" };
  }

  const datediff = checkDaysBetweenDates(item.bookingDate);
  if (datediff < 2) {
    return { response: "nej" };
  }

  const deleteBooking = new DeleteCommand({
    TableName: process.env.BOOKING_TABLE,
    Key: { bookingId },
  });

  const response = await docClient.send(deleteBooking);
  return response;
};

module.exports = { deleteBooking };
