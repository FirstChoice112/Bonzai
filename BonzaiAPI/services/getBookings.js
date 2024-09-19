const { docClient, ScanCommand } = require("../config/config.js");

const getBookings = async () => {
  try {
    const getbooking = new ScanCommand({
      TableName: process.env.BOOKING_TABLE,
    });

    const response = await docClient.send(getbooking);
    console.log("GETBOOKINGRESPONSE", response);

    return { data: response.Items };
  } catch (error) {
    console.error("Error fetching bookings", error);
    return { msg: "Could not find bookings" };
  }
};

module.exports = { getBookings };
