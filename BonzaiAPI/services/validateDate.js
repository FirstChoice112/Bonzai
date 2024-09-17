const validateDate = (stringdate) => {
  //let date1 = "01/16/2024"//true
  //let date2 = "not date string"/false
  return !isNaN(Date.parse(stringdate));
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
