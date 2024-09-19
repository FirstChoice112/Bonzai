const { client, docClient, GetCommand } = require("../config/config");

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
  const roomCapacity = { single: 1, double: 2, suite: 3 };

  const totalCapacity = rooms.reduce((acc, room) => {
    const capacity = roomCapacity[room.toLowerCase()];
    if (capacity) {
      return acc + capacity;
    } else {
      console.error(
        `Invalid room type detected during guest validation: ${room}`
      );
      return acc;
    }
  }, 0);

  const result = totalCapacity >= totalGuests;
  console.log(
    result
      ? "Sufficient capacity for all guests."
      : "Insufficient capacity for all guests."
  );
  return result;
};

// Validates if the given date string is in "YYYY-MM-DD" format and is not in the past
const validateDate = (stringDate) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(stringDate)) {
    console.error(`Invalid date format: ${stringDate}`);
    return false;
  }

  const bookedDay = new Date(stringDate).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);

  const isValidDate = bookedDay >= today && !isNaN(Date.parse(stringDate));
  if (!isValidDate) {
    console.error(`Date is either in the past or invalid: ${stringDate}`);
  } else {
    console.log(`Valid date provided: ${stringDate}`);
  }

  return isValidDate;
};

// Calculates the number of days between two dates
const checkDaysBetweenDates = (date1, date2) => {
  const checkinDate = new Date(date1);
  const checkoutDate = new Date(date2);
  const timeDiff = checkoutDate.getTime() - checkinDate.getTime();
  const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));

  console.log(
    `Days between ${checkinDate.toDateString()} and ${checkoutDate.toDateString()} is ${daysDiff}`
  );

  return daysDiff;
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
      console.error(`No booking found with bookingId: ${bookingId}`);
      return false;
    }

    console.log("Booking response:", bookingresponse);
    return bookingresponse.Item;
  } catch (error) {
    console.error(`Error fetching booking with ID ${bookingId}:`, error);
    return false;
  }
};

const checkValidUpdates = (updates) => {
  const validKeys = ["rooms", "inDate", "outDate", "totalGuests"];

  for (const key of Object.keys(updates)) {
    if (!validKeys.includes(key)) {
      console.error(`Invalid update key: ${key}`);
      return false;
    }
  }

  if (updates.rooms) {
    const isValidRoomTypes = validateRoomTypes(updates.rooms);
    console.log("Validating rooms:", updates.rooms);
    if (!isValidRoomTypes) {
      console.error(`Room validation failed: ${updates.rooms}`);
      return false;
    }
  }

  if (updates.inDate) {
    const isValidInDateFormat = validateDate(updates.inDate);
    if (!isValidInDateFormat) {
      console.error(`Invalid inDate format: ${updates.inDate}`);
      return false;
    }
  }

  if (updates.outDate) {
    const isValidOutDateFormat = validateDate(updates.outDate);
    if (!isValidOutDateFormat) {
      console.error(`Invalid outDate format: ${updates.outDate}`);
      return false;
    }
  }

  if (updates.totalGuests && typeof updates.totalGuests !== "number") {
    console.error(`Invalid totalGuests value: ${updates.totalGuests}`);
    return false;
  }

  return true;
};

const checkValidDataType = (req) => {
  const { name, email, inDate, outDate, totalGuests, rooms } = req.body;

  if (!name || !email || !inDate || !outDate || !totalGuests || !rooms) {
    console.error("Request body missing required fields:", req.body);
    return false;
  }

  if (typeof name !== "string") {
    console.error(`Invalid name data type: ${typeof name}`);
    return false;
  }

  if (typeof email !== "string") {
    console.error(`Invalid email data type: ${typeof email}`);
    return false;
  }

  if (typeof totalGuests !== "number") {
    console.error(`Invalid totalGuests data type: ${typeof totalGuests}`);
    return false;
  }

  console.log("Request data types are valid");
  return true;
};

module.exports = {
  validateRoomTypes,
  validateRoomGuests,
  validateDate,
  checkDaysBetweenDates,
  checkBookingId,
  checkValidUpdates,
  checkValidDataType,
};
