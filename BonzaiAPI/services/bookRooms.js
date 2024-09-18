const {
  client,
  docClient,
  QueryCommand,
  PutCommand,
  UpdateCommand,
} = require("../config/config");
const { validateRoomGuests } = require("./validateRooms");

const bookRooms = async (bookningDetails) => {
  try {
    const { bookingId, name, email, inDate, outDate, totalGuests, rooms } =
      bookningDetails;

    const isValidTotalGuests = validateRoomGuests(rooms, totalGuests);
    if (!isValidTotalGuests) {
      return {
        success: false,
        message: "Ej tillräcklig kapacitet för alla gäster.",
      };
    }

    //kollar så att det finns lediga rum
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

    //hämtar alla tillgängliga rum
    const availableRooms = await docClient.send(command);
    console.log("AVAILABLEROOMS", availableRooms);

    let tilldeladerum = [];

    rooms.forEach((room) => {
      const foundedRoom = availableRooms.Items.find(
        (foundroom) => foundroom.roomType == room
      );
      if (!foundedRoom) {
        tilldeladerum.push(false);
      }
      console.log("foundedroom", foundedRoom);
      tilldeladerum.push(foundedRoom);
    });

    console.log("ROOMS", tilldeladerum);

    if (tilldeladerum.includes(false)) {
      return {
        success: false,
        message: "ett eller flera av dina rumsval är fullbokade.",
      };
    }

    //roomId

    //kör in den i en loop med som innehåller updateCommand

    for (const room of tilldeladerum) {
      try {
        const idString = room.roomId.toString();
        console.log("PROCESSING ROOM", room);

        const updateroomCommand = new UpdateCommand({
          TableName: process.env.ROOMS_TABLE,
          Key: {
            roomId: idString,
          },
          UpdateExpression: "SET availableStatus = :availableStatus",
          ExpressionAttributeValues: {
            ":availableStatus": "false",
          },
          ReturnValues: "ALL_NEW",
        });

        const response = await docClient.send(updateroomCommand);
        console.log("RESPONSEUPDATEROOM", response);
      } catch (error) {
        console.log("UPDATE ERROR", error);
      }
    }
    //räkna ut totalten
    let totalCost = 0;
    tilldeladerum.forEach((room) => {
      totalCost += room.price;
    });

    //skapa putcomand till bookingtable
    const bookingCommand = new PutCommand({
      TableName: process.env.BOOKING_TABLE,
      Item: {
        bookingId: bookingId,
        name: name,
        email: email,
        inDate: inDate,
        outDate: outDate,
        totalGuests: totalGuests,
        rooms: tilldeladerum.map((room) => room.roomId),
        totalCost: totalCost,
      },
    });

    const bookingResponse = await docClient.send(bookingCommand);
    console.log("BOOKING RESPONSE", bookingResponse);

    const sendBookingData = {
      bookingId,
      name,
      email,
      inDate,
      outDate,
      totalGuests,
      rooms: tilldeladerum.map((room) => room.roomId),
      price: totalCost,
    };
    console.log("SENDBOOKINGDATA", sendBookingData);
    return {
      success: true,
      message: "Booking stored successfully",
      booking: sendBookingData,
    };
  } catch (error) {
    console.error("ERROR", error);
    return { success: "ERROR", message: "ERROR" };
  }
};

module.exports = { bookRooms };

/* 

Marcus

const { docClient, QueryCommand, PutCommand, UpdateCommand } = require("../config/config");
const { validateRoomGuests } = require("./validateRooms");

const bookRooms = async (bookingDetails) => {
  try {
    const { bookingId, name, email, inDate, outDate, totalGuests, rooms } = bookingDetails;

    if (!validateRoomGuests(rooms, totalGuests)) {
      return { success: false, message: "Ej tillräcklig kapacitet för alla gäster." };
    }

    const availableRooms = await docClient.send(
      new QueryCommand({
        TableName: process.env.ROOMS_TABLE,
        IndexName: "availableStatusIndex",
        KeyConditionExpression: "#status = :value",
        ExpressionAttributeNames: { "#status": "availableStatus" },
        ExpressionAttributeValues: { ":value": "true" },
      })
    );

    const assignedRooms = rooms.map((room) =>
      availableRooms.Items.find((r) => r.roomType === room) || false
    );

    if (assignedRooms.includes(false)) {
      return { success: false, message: "ett eller flera av dina rumsval är fullbokade." };
    }

    for (const room of assignedRooms) {
      await docClient.send(
        new UpdateCommand({
          TableName: process.env.ROOMS_TABLE,
          Key: { roomId: room.roomId.toString() },
          UpdateExpression: "SET availableStatus = :availableStatus",
          ExpressionAttributeValues: { ":availableStatus": "false" },
        })
      );
    }

    const totalCost = assignedRooms.reduce((sum, room) => sum + room.price, 0);

    await docClient.send(
      new PutCommand({
        TableName: process.env.BOOKING_TABLE,
        Item: { bookingId, name, email, inDate, outDate, totalGuests, rooms: assignedRooms.map((r) => r.roomId), totalCost },
      })
    );

    return {
      success: true,
      message: "Booking stored successfully",
      booking: { bookingId, name, email, inDate, outDate, totalGuests, rooms: assignedRooms.map((r) => r.roomId), price: totalCost },
    };
  } catch (error) {
    console.error("ERROR", error);
    return { success: "ERROR", message: "ERROR" };
  }
};

module.exports = { bookRooms };


*/
