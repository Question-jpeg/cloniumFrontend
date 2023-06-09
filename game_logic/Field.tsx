import Chip from "./Chip";
import { colorMapping } from "./config";
import { Dimensions } from "react-native";
import { isJumper } from "./../utils/isJumper";
import { ChipTypes } from "../utils/ChipTypes";
import { isBombJumper } from "./../utils/isBombJumper";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

export default class Field {
  field: any[][] = [];
  colorMapping: any = { neutral: colorMapping["neutral"] };
  cellSize: number;
  scores: any = {};

  constructor(public instruction: any, public order: string[]) {
    this.cellSize = screenWidth / instruction[0].length;

    for (let i = 0; i < order.length; i++) {
      this.colorMapping[order[i]] = colorMapping[i];
      this.scores[order[i]] = 3;
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
            this.field[i][j] = new Chip(this.order[pCount++], 3);
          else this.field[i][j] = 0;
        } else if (cell === null || cell === 0) this.field[i][j] = cell;
        else if (cell.toString().length >= 3) {
          const cellInfo = cell.split("-");
          this.field[i][j] = new Chip(
            "neutral",
            0,
            Number.parseInt(cellInfo[0]),
            Number.parseInt(cellInfo[1])
          );
        } else if (cell === "b") {
          this.field[i][j] = new Chip("neutral", 0, ChipTypes.bomb);
        } else this.field[i][j] = new Chip("neutral", cell);
      }
    }
  }

  handleSideMove(
    i: number,
    j: number,
    chip_uid: string,
    scores?: number,
    isBomb?: boolean
  ) {
    if (i < this.field.length && i > -1 && j < this.field[i].length && j > -1) {
      const cell = this.field[i][j];

      if (cell !== null) {
        if (cell === 0 || isBomb) {
          if (isBomb && isBombJumper(cell)) cell.value++;
          else
            this.field[i][j] = new Chip(
              chip_uid,
              scores ?? 1,
              isBomb ? ChipTypes.bomb : ChipTypes.player
            );
        } else {
          (cell as Chip).value += scores ?? 1;
          if (!isBombJumper(cell)) (cell as Chip).player_uid = chip_uid;
        }
      }
    }
  }

  handleSideBoom(i: number, j: number) {
    if (i < this.field.length && i > -1 && j < this.field[i].length && j > -1) {
      const cell: Chip = this.field[i][j];

      if (cell) {
        if (cell.type === ChipTypes.bomb) cell.value++;
        else if (cell.type === ChipTypes.player) this.field[i][j] = 0;
      }
    }
  }

  handleJump(i: number, j: number, scores: number) {
    const cell: Chip = this.field[i][j];
    const power = cell.power;
    const isBomb = isBombJumper(cell);

    if ([ChipTypes.jumpTop, ChipTypes.jumpBombTop].includes(cell.type)) {
      this.handleSideMove(i - power, j, cell.player_uid, scores, isBomb);
    } else if (
      [ChipTypes.jumpRight, ChipTypes.jumpBombRight].includes(cell.type)
    ) {
      this.handleSideMove(i, j + power, cell.player_uid, scores, isBomb);
    } else if (
      [ChipTypes.jumpDown, ChipTypes.jumpBombDown].includes(cell.type)
    ) {
      this.handleSideMove(i + power, j, cell.player_uid, scores, isBomb);
    } else if (
      [ChipTypes.jumpLeft, ChipTypes.jumpBombLeft].includes(cell.type)
    ) {
      this.handleSideMove(i, j - power, cell.player_uid, scores, isBomb);
    }
    cell.value -= scores;
    if (cell.value === 0) cell.player_uid = "neutral";
  }

  setScores() {
    for (let key of Object.keys(this.scores)) {
      this.scores[key] = 0;
    }
    for (let i = 0; i < this.field.length; i++) {
      for (let j = 0; j < this.field[i].length; j++) {
        const chip = this.field[i][j];
        if (chip) {
          this.scores[chip.player_uid] =
            this.scores[chip.player_uid] + chip.value;
        }
      }
    }
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
      let bombChips: number[][] = [];
      let jumps: any[][] = [];
      do {
        // do
        if (
          boomChips.length !== 0 ||
          jumps.length !== 0 ||
          bombChips.length !== 0
        ) {
          if (boomChips.length !== 0) {
            for (let boomChip of boomChips) {
              const parent_chip_uid =
                this.field[boomChip[0]][boomChip[1]]!.player_uid;
              this.field[boomChip[0]][boomChip[1]] = 0;

              this.handleSideMove(
                boomChip[0] - 1,
                boomChip[1],
                parent_chip_uid
              );
              this.handleSideMove(
                boomChip[0],
                boomChip[1] + 1,
                parent_chip_uid
              );
              this.handleSideMove(
                boomChip[0] + 1,
                boomChip[1],
                parent_chip_uid
              );
              this.handleSideMove(
                boomChip[0],
                boomChip[1] - 1,
                parent_chip_uid
              );
            }
            boomChips = [];
          }
          if (jumps.length !== 0) {
            for (let jump of jumps) {
              this.handleJump(jump[0], jump[1], jump[2]);
            }
            jumps = [];
          }
          if (bombChips.length !== 0) {
            for (let bombChip of bombChips) {
              this.field[bombChip[0]][bombChip[1]] = 0;

              this.handleSideBoom(bombChip[0] + 1, bombChip[1] + 1);
              this.handleSideBoom(bombChip[0] + 1, bombChip[1]);
              this.handleSideBoom(bombChip[0] + 1, bombChip[1] - 1);

              this.handleSideBoom(bombChip[0], bombChip[1] - 1);
              this.handleSideBoom(bombChip[0], bombChip[1] + 1);

              this.handleSideBoom(bombChip[0] - 1, bombChip[1] - 1);
              this.handleSideBoom(bombChip[0] - 1, bombChip[1]);
              this.handleSideBoom(bombChip[0] - 1, bombChip[1] + 1);
            }
            bombChips = [];
          }
        }

        // find
        for (let i = 0; i < this.field.length; i++) {
          for (let j = 0; j < this.field[i].length; j++) {
            const cell: Chip = this.field[i][j];
            if (cell) {
              if (cell.value > 3) {
                boomChips.push([i, j, cell.type]);
              } else if (
                cell.value > 0 &&
                (isJumper(cell) || isBombJumper(cell))
              ) {
                jumps.push([i, j, cell.value, isJumper(cell)]);
              } else if (cell.value > 0 && cell.type === ChipTypes.bomb) {
                bombChips.push([i, j]);
              }
            }
          }
        }

        // animate
        if (boomChips.length > 0 || jumps.length > 0 || bombChips.length > 0)
          await new Promise((resolve, reject) => {
            startBoom(Array.from(bombChips), resolve);
          });
      } while (
        boomChips.length !== 0 ||
        jumps.length !== 0 ||
        bombChips.length !== 0
      );
      this.setScores();
      refresh();
      resolve(null);
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
  renderObject(
    player_uid: string,
    value: number,
    type: ChipTypes,
    cellSize?: number
  ) {
    const chip = new Chip(player_uid, value, type);
    return chip.render(this.colorMapping, cellSize ?? this.cellSize);
  }
}
