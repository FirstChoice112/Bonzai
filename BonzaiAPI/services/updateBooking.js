//TODO: Verify that the number of guests does not exceed the capacity of the selected rooms.
//TODO: Check if the new rooms are available; if not, return an appropriate message.
//TODO: If the new rooms are available, cancel the old room reservations and book the new ones.

const {
  docClient,
  DeleteCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
} = require("../config/config.js");

const {
  validateRoomTypes,
  validateRoomGuests,
  checkDaysBetweenDates,
} = require("./validateServices");

const updateBooking = async (booking, updates) => {
  // Extract booking details such as dates, total guests, and room updates from the provided input.
  const inDate = updates.inDate;
  const outDate = updates.outDate;
  const totalGuests = updates.totalGuests;
  const rooms = updates.rooms;

  try {
    console.log("updatebooking", updates);
    let assignedRooms = [];
    let newTotalCost = 0;
    if (rooms) {
      const isValidTotalGuests = validateRoomGuests(
        rooms,
        totalGuests ? totalGuests : booking.totalGuests
      );

      if (!isValidTotalGuests) {
        console.error(
          "Insufficient capacity for all guests with room selection:",
          rooms
        );
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

      console.log("Fetching available rooms with command:", command);
      // const first = useRef(second);
      // Fetch all available rooms
      const availableRooms = await docClient.send(command);
      console.log("AVAILABLE ROOMS", availableRooms);
      //måste ha unika rums
      let changeableAvailableRooms = availableRooms.Items;
      rooms.forEach((room) => {
        console.log(
          "innan filtrering changavalableroom",
          changeableAvailableRooms
        );
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
          console.log("efter filtrering:", changeableAvailableRooms);
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

      //uppdatera de nya bokade rummen till upptagna
      for (let i = 0; i < assignedRooms.length; i++) {
        const room = assignedRooms[i];
        const idString = room.roomId.toString();
        try {
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
      const totalNightsStayed = checkDaysBetweenDates(inDate, outDate);
      assignedRooms.forEach((room) => {
        newTotalCost += room.price;
      });
      newTotalCost *= totalNightsStayed;

      //uppdatera gamla rummen till lediga
      if (assignedRooms.length) {
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
      }
    }

    //Uppdaterar alla värden i bokningsdokumentet
    console.log("before query,", totalGuests);
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
    console.log("Updating data ------>:", updateData);

    // Uppdatera bokningsinformationen
    const updateResponseData = await docClient.send(updateData);
    console.log("UPDATERESPONSEDATA", updateResponseData);

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
