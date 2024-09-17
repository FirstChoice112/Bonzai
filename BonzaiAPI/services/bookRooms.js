const {
  client,
  docClient,
  QueryCommand,
  PutCommand,
} = require("../config/config");

const bookRooms = async (bookningDetails) => {
  try {
    const { bookingId, name, email, inDate, outDate, totalGuests, rooms } = bookningDetails;

    const command = new QueryCommand({
      TableName: process.env.ROOMS_TABLE,
      IndexName: "availableStatusIndex",
      KeyConditionExpression: "#status = :value",
      ExpressionAttributeNames: {
        "#status": "availableStatus",
      },
      ExpressionAttributeValues: {
        ":value": "false",
      },
    });

    console.log("COMMAND", command);

    const availableRooms = await docClient.send(command);
    console.log("AVAILABLEROOMS", availableRooms);

    if (availableRooms.Count === 0) {
      return { success: false, message: "No rooms available" };
    }

    return { success: true, message: "Booking stored successfully", results };

  } catch (error) {
    console.error("ERROR", error);
    return { success: "ERROR", message: "ERROR",}
  }
};

module.exports = { bookRooms };

// const { client, docClient, QueryCommand, PutCommand } = require("../config/config");

// const bookRooms = async (bookingDetails) => {
//   const { bookingId, name, email, inDate, outDate, totalGuests, rooms } = bookingDetails;

//   const params = {
//     TableName: process.env.ROOMS_TABLE,
//     IndexName: "availableStatusIndex", // Assuming you have a GSI on 'available'
//     KeyConditionExpression: "#status = :statusValue",
//     ExpressionAttributeNames: {
//       "#status": "available", // Mapping for the attribute 'available'
//     },
//     ExpressionAttributeValues: {
//       ":statusValue": true, // Query for rooms that are available
//     },
//   };

//   try {
//     const availableRooms = await docClient.send(new QueryCommand(params));

//     if (availableRooms.Items && availableRooms.Items.length === 0) {
//       return { success: false, message: "No rooms available" };
//     }

//     // Assuming the logic to book rooms (e.g., store booking data in DynamoDB)
//     const putParams = {
//       TableName: process.env.BOOKINGS_TABLE, // The table where booking records are stored
//       Item: {
//         bookingId,
//         name,
//         email,
//         inDate,
//         outDate,
//         totalGuests,
//         rooms,
//         createdAt: new Date().toISOString(),
//       },
//     };

//     const result = await docClient.send(new PutCommand(putParams));
//     return { success: true, message: "Booking stored successfully", result };
//   } catch (error) {
//     console.error(error);
//     throw new Error("Error storing booking details");
//   }
// };

// module.exports = { bookRooms };
