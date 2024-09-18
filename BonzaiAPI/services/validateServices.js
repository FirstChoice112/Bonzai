const { client, docClient, GetCommand } = require("../config/config");

// Validates that all room types in the array are valid values
const validateRoomTypes = (rooms) => {
  const validValues = ["single", "double", "suite"];
  return rooms.every((item) => validValues.includes(item.toLowerCase()));
};

// Checks if the total room capacity is sufficient for the given number of guests
const validateRoomGuests = (rooms, totalGuests) => {
  const roomCapacity = { single: 1, double: 2, suite: 3 };
  const totalCapacity = rooms.reduce(
    (acc, room) => acc + roomCapacity[room],
    0
  );

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
  if (!regex.test(stringDate)) return false;

  const bookedDay = new Date(stringDate).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);

  return bookedDay >= today && !isNaN(Date.parse(stringDate));
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
  const bookingresponse = await docClient.send(
    new GetCommand({
      TableName: process.env.BOOKING_TABLE,
      Key: { bookingId },
    })
  );

  console.log("Booking response:", bookingresponse);
  return bookingresponse.Item || false;
};

const checkValidUpdates = (updates) => {
  const validKeys = ["rooms", "inDate", "outDate", "totalGuests"];
  //Se över
  for (const key of updates) {
    const isValidKey = validKeys.includes(key);
    if (!isValidKey) {
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

  if (updates.totalGuests) {
    if (!typeof updates.totalGuests == "number") {
      return false;
    }
  }

  return true;
};

const checkValidDataType = (req) => {
  const { name, email, inDate, outDate, totalGuests, rooms } = req.body;

  console.log(typeof name, typeof email, typeof inDate, typeof outDate);

  if (!name || !email || !inDate || !outDate || !totalGuests || !rooms) {
    console.log("reqbody");
    return false;
  }

  if (typeof name !== "string") {
    console.log("name smäller", typeof name);
    return false;
  }

  if (typeof email !== "string") {
    console.log("mail smäller", typeof email);
    return false;
  }

  if (typeof totalGuests !== "number") {
    console.log("toalguest smäller", typeof totalGuests);
    return false;
  } else return true;
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

/* 

const checkValidUpdates = (updates) => {
  const validKeys = ["rooms", "inDate", "outDate", "totalGuests"];

  // Loop over the keys in the 'updates' object
  for (const key in updates) {
    const isValidKey = validKeys.includes(key); // Correct usage of includes
    if (!isValidKey) {
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
  
  if (updates.totalGuests) {
    if (typeof updates.totalGuests !== "number") { // Correct type check
      return false;
    }
  }

  return true;
};


*/
