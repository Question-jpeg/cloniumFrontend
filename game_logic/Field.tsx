import Chip from "./Chip";
import { colorMapping } from "./config";
import { Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

export default class Field {
  field: any[][] = [];
  colorMapping: any = { neutral: colorMapping["neutral"] };
  cellSize: number;

  constructor(public instruction: any, public order: string[]) {
    this.cellSize = screenWidth / instruction[0].length;

    for (let i = 0; i < order.length; i++) {
      this.colorMapping[order[i]] = colorMapping[i];
    }

    this.initField();
  }

  initField() {
    let pCount = 0;
    for (let i = 0; i < this.instruction.length; i++) {
      this.field.push(Array(this.instruction[i].length));
      for (let j = 0; j < this.instruction[0].length; j++) {
        const cell = this.instruction[i][j];
        if (cell === "p") {
          if (pCount < this.order.length)
            this.field[i][j] = new Chip(this.order[pCount++], 1);
          else this.field[i][j] = 0;
        } else if (cell === null || cell === 0) this.field[i][j] = cell;
        else this.field[i][j] = new Chip("neutral", cell);
      }
    }
  }

  handleSideMove(i: number, j: number, chip_uid: string) {
    if (i < this.field.length && i > -1 && j < this.field[i].length && j > -1) {
      const cell = this.field[i][j];

      if (cell !== null) {
        if (cell === 0) this.field[i][j] = new Chip(chip_uid);
        else {
          (cell as Chip).player_uid = chip_uid;
          (cell as Chip).value++;
        }
      }
    }
  }

  getScores() {
    const scores: any = {};
    for (let i = 0; i < this.field.length; i++) {
      for (let j = 0; j < this.field[i].length; j++) {
        const chip = this.field[i][j];
        if (chip) {
          scores[chip.player_uid] = scores[chip.player_uid]
            ? scores[chip.player_uid] + chip.value
            : chip.value;
        }
      }
    }
    return scores;
  }

  async handleMove(
    i: number,
    j: number,
    startBoom: Function,
    refresh: Function
  ) {
    return new Promise(async (resolve, reject) => {
      const chip = this.field[i][j] as Chip;
      chip.value++;
      let boomChips: number[][] = [];
      do {
        if (boomChips.length != 0) {
          for (let boomChip of boomChips) {
            const parent_chip_uid =
              this.field[boomChip[0]][boomChip[1]]!.player_uid;
            this.field[boomChip[0]][boomChip[1]] = 0;

            this.handleSideMove(boomChip[0] - 1, boomChip[1], parent_chip_uid);
            this.handleSideMove(boomChip[0], boomChip[1] + 1, parent_chip_uid);
            this.handleSideMove(boomChip[0] + 1, boomChip[1], parent_chip_uid);
            this.handleSideMove(boomChip[0], boomChip[1] - 1, parent_chip_uid);
            refresh();
          }
          boomChips = [];
        }
        for (let i = 0; i < this.field.length; i++) {
          for (let j = 0; j < this.field[i].length; j++) {
            if (this.field[i][j]?.value > 3) {
              boomChips.push([i, j]);
            }
          }
        }

        if (boomChips.length > 0)
          await new Promise((resolve, reject) => {
            startBoom(Array.from(boomChips), resolve);
          });
      } while (boomChips.length != 0);

      resolve();
    });
  }

  removePlayer(player_uid: string) {
    for (let i = 0; i < this.field.length; i++) {
      for (let j = 0; j < this.field[i].length; j++) {
        if (this.field[i][j]?.player_uid === player_uid) {
          if (this.instruction[i][j] === 0 || this.instruction[i][j] === null)
            this.field[i][j] = this.instruction[i][j];
          else this.field[i][j] = 0;
        }
      }
    }
  }

  renderChip(chip: Chip) {
    return chip.render(this.colorMapping, this.cellSize);
  }
  renderNewChip(player_uid: string, value?: number, cellSize?: number) {
    const chip = new Chip(player_uid, value);
    return chip.render(this.colorMapping, cellSize ?? this.cellSize);
  }
}
