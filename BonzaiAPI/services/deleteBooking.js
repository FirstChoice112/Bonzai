const { client, docClient, DeleteCommand } = require("../config/config.js");

const deleteBooking = async (bookingid) => {
<<<<<<< HEAD
    const deleteBooking = new DeleteCommand({
        TableName: process.env.BOOKING_TABLE,
        Key:{
            bookingId: bookingid
        },
    });

    const response = await docClient.send(deleteBooking);
    console.log("RESPONSE", response);
    return response;

}
=======
  const deleteBooking = new DeleteCommand({
    TableName: process.env.BOOKING_TABLE,
    Key: {
      bookingId: bookingid,
    },
  });

  const response = await docClient.send(deleteBooking);
  console.log("RESPONSE", response);

  return response;
};

module.exports = { deleteBooking };
>>>>>>> origin/dev
