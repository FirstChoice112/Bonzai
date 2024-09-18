const validateDate = (stringDate) => {
  //let date1 = "01/16/2024"//true
  //let date2 = "not date string"/false
  // Format 1: "YYYY-MM-DD" (Y-year, M- month, D - date)

  const regex = /^\d{4}-\d{2}-\d{2}$/; // "YYYY-MM-DD"

  const validFormat = regex.test(stringDate);
  if (!validFormat) {
    return false;
  }

  const bookedDay = new Date(stringDate);
  bookedDay.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (bookedDay < today) {
    return false;
  }

  return !isNaN(Date.parse(stringDate));
};

const checkDaysBetweenDates = (date1, date2) => {
  let checkinDate = new Date(date1); //format "01/16/2024"
  let checkoutDate = new Date(date2); //format "01/18/2024"
  let timeDiff = date2.getTime() - date1.getTime();
  let daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));
  console.log(
    `Days between ${checkinDate.toStringDate} and ${checkoutDate.toDateString} is ${daysDiff}`
  ); //Days between 01/16/2024 and 01/18/2024 is 2 days
  return daysDiff;
};

module.exports = { validateDate, checkDaysBetweenDates };

/* 

Marcus

const checkDaysBetweenDates = (date1, date2) => {
  const checkinDate = new Date(date1);  
  const checkoutDate = new Date(date2); 

  const timeDiff = checkoutDate.getTime() - checkinDate.getTime(); 
  const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));

  console.log(
    `Days between ${checkinDate.toDateString()} and ${checkoutDate.toDateString()} is ${daysDiff} day(s)`
  );

  return daysDiff;
};

*/
