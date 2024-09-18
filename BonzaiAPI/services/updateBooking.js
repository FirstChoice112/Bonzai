const {
  docClient,
  DeleteCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
} = require("../config/config.js");

const { validateRoomTypes, validateRoomGuests } = require("./validateServices");

const updateBooking = async (booking, updates) => {
  // Validate room types and guests
  const inDate = updates.inDate;
  const outDate = updates.outDate;
  const totalGuests = updates.totalguests;
  const rooms = updates.rooms;

  //kolla så att antalet gäster inte överstiger antal möjliga platser
  //kolla om nya rummen är lediga, om inte skicka tillbaka message
  //om lediga avboka gamla rummen, boka de nya

  if (rooms) {
    const assignedRooms = [];

    const isValidTotalGuests = validateRoomGuests(
      rooms,
      totalGuests ? totalGuests : booking.totalGuests
    );

    if (!isValidTotalGuests) {
      return {
        success: false,
        message: "Insufficient capacity for all guests.",
      };
    }

    const command = new QueryCommand({
      TableName: process.env.ROOMS_TABLE,
      IndexName: "availableStatusIndex",
      KeyConditionExpression: "#status = :value",
      ExpressionAttributeNames: {
        "#status": "availableStatus",
      },
      ExpressionAttributeValues: {
        ":value": "true",
      },
    });

    console.log("COMMAND", command);

    // Fetch all available rooms
    const availableRooms = await docClient.send(command);
    console.log("AVAILABLE ROOMS", availableRooms);

    rooms.forEach((room) => {
      const foundRoom = availableRooms.Items.find(
        (availableRoom) => availableRoom.roomType === room
      );
      if (!foundRoom) {
        assignedRooms.push(false);
      } else {
        assignedRooms.push(foundRoom);
      }
      console.log("FOUND ROOM", foundRoom);
    });
    // här ska vi avboka booking.rooms ["",""]

    console.log("ROOMS", assignedRooms);

    // If one or more room selections are fully booked
    if (assignedRooms.includes(false)) {
      return {
        success: false,
        message: "One or more of your room selections are fully booked.",
      };
    }
  }

  const updateData = new UpdateCommand({
    TableName: process.env.BOOKING_TABLE,
    Key: {
      bookingId: booking.bookingId,
    },
    UpdateExpression:
      "set inDate = :inDate, outDate = :outDate, totalGuests = :totalGuests, rooms = :rooms",
    ExpressionAttributeValues: {
      ":inDate": inDate ? inDate : booking.inDate,
      ":outDate": outDate ? outDate : booking.outDate,
      ":totalGuests": totalGuests ? totalGuests : booking.totalGuests,
      ":rooms": assignedRooms.length ? assignedRooms : booking.rooms,
    },
    ReturnValues: "ALL_NEW",
  });

  // Update the booking information
  const updateResponseData = await docClient.send(updateData);
  console.log("UPDATERESPONSEDATA", updateResponseData);

  // Return the updated response data
  return {
    success: true,
    data: updateResponseData,
  };
};

// const command = new UpdateCommand({
//   TableName: "todos",
//   Key: {
//       taskId: 1,
//   },
//   UpdateExpression: "set Color = :color, task = :task",
//   ExpressionAttributeValues: {
//       ":color": "gul",
//       ":task": "köpa leksak"
//   },
//   ReturnValues: "ALL_NEW",

module.exports = { updateBooking };
