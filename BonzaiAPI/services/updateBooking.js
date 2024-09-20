const {
  docClient,
  UpdateCommand,
  QueryCommand,
} = require("../config/config.js");

const {
  validateRoomGuests,
  checkDaysBetweenDates,
} = require("./validateServices");

// Extract booking details such as dates, total guests, and room updates from the provided input.
const updateBooking = async (booking, updates, fetchedRooms) => {
  const inDate = updates.inDate;
  const outDate = updates.outDate;
  const totalGuests = updates.totalGuests;
  let roomTypes;

  if (fetchedRooms) {
    roomTypes = fetchedRooms.map((room) => room.roomType);
  }
  const rooms = updates.rooms;

  try {
    let assignedRooms = [];
    let newTotalCost = 0;

    //fetchedrooms behöver mapas om till rumstypen

    const isValidTotalGuests = validateRoomGuests(
      rooms !== undefined ? rooms : roomTypes,
      totalGuests !== undefined ? totalGuests : booking.totalGuests
    );

    if (!isValidTotalGuests) {
      return {
        success: false,
        message: "Insufficient capacity for all guests.",
      };
    }

    if (rooms) {
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

      // Fetch all available rooms
      const availableRooms = await docClient.send(command);

      let changeableAvailableRooms = availableRooms.Items;
      rooms.forEach((room) => {
        const foundRoom = changeableAvailableRooms.find(
          (availableRoom) => availableRoom.roomType === room
        );
        if (!foundRoom) {
          assignedRooms.push(false);
        } else {
          changeableAvailableRooms = changeableAvailableRooms.filter(
            (room) => room.roomId !== foundRoom.roomId
          );
          assignedRooms.push(foundRoom);
        }
      });

      // If one or more room selections are fully booked

      if (assignedRooms.includes(false)) {
        return {
          success: false,
          message: "One or more of your room selections are fully booked.",
        };
      }

      //Uppdate new rooms to as false on availableStatus
      for (let i = 0; i < assignedRooms.length; i++) {
        const room = assignedRooms[i];
        const idString = room.roomId.toString();
        try {
          const updateRoomCommand = new UpdateCommand({
            TableName: process.env.ROOMS_TABLE,
            Key: { roomId: idString },
            UpdateExpression: "SET availableStatus = :availableStatus",
            ExpressionAttributeValues: { ":availableStatus": "false" },
            ReturnValues: "ALL_NEW",
          });

          const response = await docClient.send(updateRoomCommand);
        } catch (error) {}
      }

      // Calculate total cost times the number of nights.
      // const totalNightsStayed = checkDaysBetweenDates(inDate, outDate);
      // assignedRooms.forEach((room) => {
      //   newTotalCost += room.price;
      // });
      // newTotalCost *= totalNightsStayed;

      //Uppdate availableStatus on old rooms from false to true
      if (assignedRooms.length) {
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
      }
    }

    const totalNightsStayed = checkDaysBetweenDates(
      inDate !== undefined ? inDate : booking.inDate,
      outDate !== undefined ? outDate : booking.outDate
    );

    console.log("totalnightsstayed", totalNightsStayed);

    newTotalCost = assignedRooms.length
      ? assignedRooms.reduce((acc, room) => acc + room.price, 0) *
        totalNightsStayed
      : fetchedRooms.reduce((acc, room) => acc + room.price, 0) *
        totalNightsStayed;

    //Update all changed values in the database
    const updateData = new UpdateCommand({
      TableName: process.env.BOOKING_TABLE,
      Key: {
        bookingId: booking.bookingId,
      },
      UpdateExpression:
        "set inDate = :inDate, outDate = :outDate, totalGuests = :totalGuests, rooms = :rooms, totalCost = :totalCost",
      ExpressionAttributeValues: {
        ":inDate": inDate ? inDate : booking.inDate,
        ":outDate": outDate ? outDate : booking.outDate,
        ":totalGuests":
          totalGuests !== undefined ? totalGuests : booking.totalGuests,
        ":rooms": assignedRooms.length
          ? assignedRooms.map((room) => room.roomId)
          : booking.rooms,
        ":totalCost": newTotalCost ? newTotalCost : booking.totalCost,
      },
      ReturnValues: "ALL_NEW",
    });
    const updateResponseData = await docClient.send(updateData);

    // Return the updated response data
    return {
      success: true,
      data: updateResponseData,
    };
  } catch (error) {
    console.error("Error occurred during booking update:", error);
    return {
      success: false,
      message: "An error occurred while updating the booking.",
    };
  }
};

module.exports = { updateBooking };
