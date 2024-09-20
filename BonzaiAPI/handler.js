// Import your custom services
const {
  validateDate,
  validateRoomTypes,
  checkBookingId,
  checkValidUpdates,
  checkValidDataType,
  checkDaysBetweenDates,
  checkInAndOutDate,
  getRooms,
} = require("./services/validateServices");
const { bookRooms } = require("./services/bookRooms");
const { updateBooking } = require("./services/updateBooking");
const { cancelBooking } = require("./services/cancelBooking");
const { getBookings } = require("./services/getBookings");
const express = require("express");
const serverless = require("serverless-http");

const app = express();

// Middleware to generate a unique ID for each booking
const crypto = require("crypto");

app.use(express.json());

const handleError = (
  res,
  error,
  statusCode = 500,
  message = "Internal Server Error"
) => {
  console.error(`Error: ${message}`, error);
  res.status(statusCode).json({ error: message });
};

app.get("/allbookings", async (req, res) => {
  try {
    const response = await getBookings();

    res.status(200).json({ bookings: response });
  } catch (error) {
    return res.status(500).json({ message: "Faild to fetch bookings" });
  }
});

app.post("/bookroom", async (req, res) => {
  let uuid = crypto.randomUUID();

  try {
    const { name, email, inDate, outDate, totalGuests, rooms } = req.body;

    console.log("Request body received:", req.body);

    const isValidInDate = validateDate(inDate);
    const isValidOutDate = validateDate(outDate);

    if (!isValidInDate || !isValidOutDate) {
      console.error("Invalid date format provided:", { inDate, outDate });
      return res
        .status(400)
        .json({ message: "Invalid date format, yyyy-mm-dd is required" });
    }

    const isValidRoomTypes = validateRoomTypes(rooms);
    if (!isValidRoomTypes) {
      console.error("Invalid room type provided:", rooms);
      return res.status(400).json({
        message: "Invalid room type. Choose Single, Double, or Suite.",
      });
    }

    const isValid = checkValidDataType(req);
    if (!isValid) {
      console.error("Invalid data types in the request body:", req.body);
      return res.status(400).json({
        message: "All fields are required",
        typeSpec: {
          name: "string",
          email: "string",
          inDate: "string",
          outDate: "YYYY-MM-DD",
          totalGuests: "number",
          rooms: "array",
        },
      });
    }

    const placeholder = {
      bookingId: uuid,
      name,
      email,
      inDate,
      outDate,
      totalGuests,
      rooms,
    };
    const isValidInOutDates = checkInAndOutDate(inDate, outDate);
    if (!isValidInOutDates) {
      return res
        .status(404)
        .json({ message: "outdate can't be booked before indate" });
    }
    const response = await bookRooms(placeholder);

    console.log("Booking request placeholder:", placeholder);
    console.log("Response from bookRooms:", response);

    if (!response.success) {
      console.error("Booking failed with response:", response);
      return res.status(400).json({
        data: response,
        success: response.success,
        message: response.message,
      });
    }

    console.log("Booking successful with response:", response);
    res.status(200).json({ data: response });
  } catch (error) {
    console.error("Error occurred during room booking:", error);
    handleError(res, error);
  }
});

app.put("/update", async (req, res) => {
  try {
    const { bookingId, updates } = req.body;
    console.log(
      `Request to update booking ID: ${bookingId} with updates:`,
      updates
    );

    const booking = await checkBookingId(bookingId);
    if (!booking) {
      console.error(`Booking not found for ID: ${bookingId}`);
      return res.status(400).json({ message: "Booking could not be found" });
    }

    const isValidUpdates = checkValidUpdates(updates);
    if (!isValidUpdates) {
      console.error(
        `Invalid updates provided for booking ID: ${bookingId}`,
        updates
      );
      return res.status(400).json({
        message: "Invalid data types",
        validDataTypes: {
          inDate: "YYYY-MM-DD",
          outDate: "YYYY-MM-DD",
          totalGuests: "number",
          rooms: ["suite", "double", "single"],
        },
      });
    }
    if (updates.inDate || updates.outDate) {
      const inDate = updates.inDate ? updates.inDate : booking.inDate;
      const outDate = updates.outDate ? updates.outDate : booking.outDate;
      const isValidInOutDates = checkInAndOutDate(inDate, outDate);
      if (!isValidInOutDates) {
        return res
          .status(404)
          .json({ message: "outdate can't be before indate" });
      }
    }
    let roomResponse;
    if (!updates.rooms) {
      roomResponse = await getRooms(booking.rooms);
    }
    const response = await updateBooking(booking, updates, roomResponse);

    if (!response.success) {
      return res.status(500).json({
        message: response.message
          ? response.message
          : "Your updated booking was declined from database",
      });
    }
    return res
      .status(200)
      .json({ data: response.data, message: response.message });
  } catch (error) {
    console.error("Error occurred during booking update:", error);
    return res.status(500).json({ message: "faild to update booking" });
  }
});

app.delete("/cancelbooking/:bookingId", async (req, res) => {
  const { bookingId } = req.params;
  try {
    const booking = await checkBookingId(bookingId);

    if (!booking) {
      return res
        .status(400)
        .json({ message: "Your booking could not be found" });
    }

    const today = new Date();
    const dateDiff = checkDaysBetweenDates(today, booking.inDate);

    if (dateDiff < 2) {
      return res.status(400).json({
        message:
          "Booking cannot be canceled within less than two days of the check-in date",
      });
    }

    await cancelBooking(booking, bookingId);
    // Return success message
    return res.status(200).json({
      message: "Booking canceled successfully",
      canceledBooking: booking,
    });
  } catch (error) {
    console.error("Error occurred during booking cancellation:", error);
    return res.status(500).json({ message: "faild to cancel booking" });
  }
});

app.use((req, res) => {
  console.error(`Route not found: ${req.originalUrl}`);
  res.status(404).json({ error: "Route not found" });
});

exports.handler = serverless(app);
