const { docClient, GetCommand } = require("../config/config");

// Validates that all room types in the array are valid values
const validateRoomTypes = (rooms) => {
  const validValues = ["single", "double", "suite"];
  const isValid = rooms.every((item) =>
    validValues.includes(item.toLowerCase())
  );

  if (!isValid) {
    console.error(`Invalid room types detected: ${rooms}`);
  } else {
    console.log(`All room types are valid: ${rooms}`);
  }

  return isValid;
};

// Checks if the total room capacity is sufficient for the given number of guests
const validateRoomGuests = (rooms, totalGuests) => {
  const roomCapacity = {
    single: 1,
    double: 2,
    suite: 3,
  };

  // Steg 1: Beräkna den totala kapaciteten för de valda rummen
  let totalCapacity = rooms.reduce((acc, room) => {
    return acc + roomCapacity[room];
  }, 0);

  return totalCapacity >= totalGuests;
};

// Validates if the given date string is in "YYYY-MM-DD" format and that inDate it is not in the past
const validateDate = (stringDate) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(stringDate)) {
    console.error(`Invalid date format: ${stringDate}`);
    return false;
  }

  const bookedDay = new Date(stringDate).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  const isValidDate = bookedDay >= today && !isNaN(Date.parse(stringDate));

  return isValidDate;
};

// Calculates the number of days between inDate and outDate
const checkDaysBetweenDates = (date1, date2) => {
  return Math.round((new Date(date2) - new Date(date1)) / (1000 * 3600 * 24));
};

// Fetches booking information by bookingId from the database
const checkBookingId = async (bookingId) => {
  try {
    const bookingresponse = await docClient.send(
      new GetCommand({
        TableName: process.env.BOOKING_TABLE,
        Key: { bookingId },
      })
    );
    if (!bookingresponse.Item) {
      return false;
    }
    return bookingresponse.Item;
  } catch (error) {
    return false;
  }
};

const getRooms = async (rooms) => {
  let roomTypes = [];
  for (let i = 0; i < rooms.length; i++) {
    const roomId = rooms[i];
    const idString = roomId.toString();
    try {
      const roomResponse = await docClient.send(
        new GetCommand({
          TableName: process.env.ROOMS_TABLE,
          Key: { roomId: idString },
        })
      );

      if (!roomResponse.Item) {
        return false;
      }
      roomTypes.push(roomResponse.Item);
    } catch (error) {
      return false;
    }
  }

  return roomTypes;
};

// Check if data within updates-body contains correct keys
const checkValidUpdates = (updates) => {
  const validKeys = ["rooms", "inDate", "outDate", "totalGuests"];

  for (const key of Object.keys(updates)) {
    if (!validKeys.includes(key)) {
      return false;
    }
  }

  if (updates.rooms) {
    const isValidRoomTypes = validateRoomTypes(updates.rooms);
    if (!isValidRoomTypes) {
      return false;
    }
  }

  if (updates.inDate) {
    const isValidInDateFormat = validateDate(updates.inDate);
    if (!isValidInDateFormat) {
      return false;
    }
  }

  if (updates.outDate) {
    const isValidOutDateFormat = validateDate(updates.outDate);
    if (!isValidOutDateFormat) {
      return false;
    }
  }

  if (updates.totalGuests && typeof updates.totalGuests !== "number") {
    return false;
  }

  return true;
};

// Check if inputdata is of correct datatypes
const checkValidDataType = (req) => {
  const { name, email, inDate, outDate, totalGuests, rooms } = req.body;

  if (!name || !email || !inDate || !outDate || !totalGuests || !rooms) {
    return false;
  }

  if (typeof name !== "string") {
    return false;
  }

  if (typeof email !== "string") {
    return false;
  }

  if (typeof totalGuests !== "number") {
    return false;
  }

  return true;
};

//check to see that outDate isn't before inDate
const checkInAndOutDate = (inDate, outDate) => {
  const inCheckDate = new Date(inDate);
  inCheckDate.setHours(0, 0, 0, 0);
  const outCheckDate = new Date(outDate);
  outCheckDate.setHours(0, 0, 0, 0);
  return outCheckDate >= inCheckDate;
};

module.exports = {
  validateRoomTypes,
  validateRoomGuests,
  validateDate,
  checkDaysBetweenDates,
  checkBookingId,
  checkValidUpdates,
  checkValidDataType,
  checkInAndOutDate,
  getRooms,
};
