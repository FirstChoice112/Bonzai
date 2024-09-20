# Serverless Framework Node Express API on AWS

# BonzaiAPI

### Projektbeskrivning

BonzaiAPI är ett serverlöst hotellbokningssystem byggt på AWS som hanterar rumsbokningar, uppdateringar och avbokningar. Systemet använder DynamoDB för att lagra boknings- och rumsinformation och erbjuder användarvänliga funktioner för att skapa, uppdatera, och avboka rum. Det är designat för att vara skalbart och kostnadseffektivt genom användning av AWS Lambda och Serverless Framework.

### Projektmedlemmar

- **Theeraphan Apiban**
- **Linn Johansson**
- **Johan Skoog**
- **Marcus Widén**

---

## Funktionalitet

BonzaiAPI tillhandahåller följande funktioner:

- **Boka rum**: Användare kan boka tillgängliga rum baserat på valda datum.
- **Avboka bokning**: Användare kan avboka en bokning med hjälp av ett unikt boknings-ID.
- **Uppdatera bokning**: Användare kan uppdatera en befintlig bokning (t.ex. ändra datum eller rum).
- **Hämta alla bokningar**: Visar en lista över alla bokningar som gjorts i systemet.

---

## Valideringar

- **vid bokning**:
  -säkerställer så att vid bokning så finns alla efterfrågade properties med och att det är av rätt datatyp.
- \*rooms
- rooms ska va en Array innehållande strings och de tillåtna värdena är "single","double", "suite"
- totalGuests får ej överstiga antalet totalt tållåtna beräknat på de önskade rummen
- det går ej att genomföra sin bokning ifall någon av de valda rumstyperna är fullbokade
- \*inDate/outDate
- datum ska vara i formatet "yyyy-mm-dd", annars är det invalid. En säkerställning sker även så att outDate ej är före inDate och inDate får ej vara före idag.

- **vid uppdatering**:
- säkerställer så att den angivna bokningen med bookingId faktiskt finns
- säkerställer att de properties som kommer med från body är en tillåten, samt att de är av rätt datatyp.
- vid rums uppdatering skrivs de gamla rummen över, med de nya från body
- samma valideringar som vid bokning gällande room samt inDate/outDate
-

- **vid avbokning**:
- säkerställer så att det angivna bokningId finns
- validering så att det minst är två dagar kvar till inDate, annars är avbokning är tillåten.
- rummen som var bokade blir tillgängliga igen.

## Teknologier

Projektet använder följande teknologier:

- **Backend**: Node.js, AWS Lambda
- **Databas**: DynamoDB
- **API Gateway**: AWS API Gateway
- **Deployment**: Serverless Framework
- **Språk**: JavaScript

---

## Förutsättningar

För att köra projektet behöver du:

- **Node.js** installerat
- Ett **AWS-konto** konfigurerat
- **Serverless Framework** installerat

---

## API-dokumentation

Nedan följer en översikt av de API-slutpunkter som tillhandahålls av BonzaiAPI:

POST /bookroom Boka ett rum
DELETE /cancelbooking/{bookingId} Avboka en bokning
PUT /update Uppdatera en bokning
GET /allbookings Hämta alla bokningar

## Databasstruktur

BookingTable
bookingId: Primärnyckel (String)
checkInDate: Incheckningsdatum (String)
guestName: Gästens namn (String)
RoomsTable
roomId: Primärnyckel (String)
availableStatus: Anger om ett rum är tillgängligt (String)
GlobalSecondaryIndexes: Index för att spåra rumstillgänglighet

## Usage

endpoints:
POST - https://2l9zrqz682.execute-api.eu-north-1.amazonaws.com/bookroom

schema body: JSON
{
"name":"namn",
"email":"mail@mail.com",
"inDate":"yyyy-mm-dd",
"outDate": "yyyy-mm-dd",
"totalGuests": number,
"rooms": [
"suite"
"double",
"single"
]
}

DELETE - https://2l9zrqz682.execute-api.eu-north-1.amazonaws.com/cancelbooking/{bookingId}

PUT - https://2l9zrqz682.execute-api.eu-north-1.amazonaws.com/update

schema body: JSON
{
"bookingId":"bookingId",
// vilka man vill ändra på
"updates":{
"inDate":"yyyy-mm-dd",
"totalGuests" "number"
"rooms":[
"single",
"double",
"suite"
]
}
}

GET - https://2l9zrqz682.execute-api.eu-north-1.amazonaws.com/allbookings
