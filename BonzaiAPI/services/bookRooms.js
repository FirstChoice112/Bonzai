const {
  client,
  docClient,
  QueryCommand,
  PutCommand,
  UpdateCommand,
} = require("../config/config");
const { validateRoomGuests } = require("./validateServices");

// Books rooms based on the provided booking details and availability of rooms
const bookRooms = async (bookingDetails) => {
  try {
    const { bookingId, name, email, inDate, outDate, totalGuests, rooms } =
      bookingDetails;

    // Validate if the total guests fit the room capacity
    const isValidTotalGuests = validateRoomGuests(rooms, totalGuests);
    if (!isValidTotalGuests) {
      return {
        success: false,
        message: "Insufficient capacity for all guests.",
      };
    }

    // Check if there are available rooms
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

    let assignedRooms = [];

    rooms.forEach((room) => {
      const foundRoom = availableRooms.Items.find(
        (availableRoom) => availableRoom.roomType === room
      );
      if (!foundRoom) {
        assignedRooms.push(false);
      }
      console.log("FOUND ROOM", foundRoom);
      assignedRooms.push(foundRoom);
    });

    console.log("ROOMS", assignedRooms);

    // If one or more room selections are fully booked
    if (assignedRooms.includes(false)) {
      return {
        success: false,
        message: "One or more of your room selections are fully booked.",
      };
    }

    // Process room updates to mark them as unavailable
    for (const room of assignedRooms) {
      try {
        const idString = room.roomId.toString();
        console.log("PROCESSING ROOM", room);

        const updateRoomCommand = new UpdateCommand({
          TableName: process.env.ROOMS_TABLE,
          Key: { roomId: idString },
          UpdateExpression: "SET availableStatus = :availableStatus",
          ExpressionAttributeValues: { ":availableStatus": "false" },
          ReturnValues: "ALL_NEW",
        });

        const response = await docClient.send(updateRoomCommand);
        console.log("ROOM UPDATE RESPONSE", response);
      } catch (error) {
        console.log("UPDATE ERROR", error);
      }
    }

    // Calculate the total cost of the rooms
    let totalCost = 0;
    assignedRooms.forEach((room) => {
      totalCost += room.price;
    });

    // Create a booking entry in the booking table
    const bookingCommand = new PutCommand({
      TableName: process.env.BOOKING_TABLE,
      Item: {
        bookingId: bookingId,
        name: name,
        email: email,
        inDate: inDate,
        outDate: outDate,
        totalGuests: totalGuests,
        rooms: assignedRooms.map((room) => room.roomId),
        totalCost: totalCost,
      },
    });

    const bookingResponse = await docClient.send(bookingCommand);
    console.log("BOOKING RESPONSE", bookingResponse);

    // Prepare and return the booking details
    const sendBookingData = {
      bookingId,
      name,
      email,
      inDate,
      outDate,
      totalGuests,
      rooms: assignedRooms.map((room) => room.roomId),
      price: totalCost,
    };
    console.log("SEND BOOKING DATA", sendBookingData);
    return {
      success: true,
      message: "Booking stored successfully",
      booking: sendBookingData,
    };
  } catch (error) {
    console.error("ERROR", error);
    return { success: false, message: "Error occurred during booking." };
  }
};

module.exports = { bookRooms };
