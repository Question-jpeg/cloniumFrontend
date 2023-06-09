// import { ChipTypes } from "./Chip";

// import Chip from "./Chip";

class Chip {
    constructor(value, ok) {}
}

// const printType = (type: ChipTypes) => {
//     console.log(type);
// }

// printType(1)
const chip = new Chip('1', 1)
const a = { [chip]: "a" };

console.log(a[chip]);
