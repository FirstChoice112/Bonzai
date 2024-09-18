const validateRoomTypes = (rooms) => {
  const validValues = ["single", "double", "suite"];
  return rooms.every((item) => validValues.includes(item.toLowerCase()));
};

const validateRoomGuests = (rooms, totalGuests) => {
  const roomCapacity = {
    single: 1,
    double: 2,
    suite: 3,
  };
  let totalCapacity = rooms.reduce((acc, room) => {
    return acc + roomCapacity[room];
  }, 0);

  // Steg 2: Jämför den totala kapaciteten med antalet gäster
  if (totalCapacity >= totalGuests) {
    console.log("Tillräcklig kapacitet för alla gäster.");
    return true;
  } else {
    console.log("Ej tillräcklig kapacitet för alla gäster.");
    return false;
  }
};
module.exports = { validateRoomTypes, validateRoomGuests };

/* 

Marcus 

const validateRoomTypes = (rooms) => {
  const validValues = ["single", "double", "suite"];
  return rooms.every((item) => validValues.includes(item.toLowerCase()));
};

const validateRoomGuests = (rooms, totalGuests) => {
  const roomCapacity = {
    single: 1,
    double: 2,
    suite: 3,
  };
  
  let totalCapacity = rooms.reduce((acc, room) => acc + roomCapacity[room], 0);

  return totalCapacity >= totalGuests;
};

module.exports = { validateRoomTypes, validateRoomGuests };

*/
