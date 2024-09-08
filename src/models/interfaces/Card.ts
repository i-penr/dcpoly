export default interface Card {
   title: string;
   description: string;
   money?: number;
   givesJailCard?: boolean;
   othersInvolved?: boolean;
   squareRelative?: number;
   squareAbsolute?: number;
   goesToJail?: boolean;
   houseMultiplier?: boolean;
   hotelMultiplier?: boolean;
}