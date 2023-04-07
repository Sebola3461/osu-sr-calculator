import colors from "colors";
import { readFileSync } from "fs";
import { BeatmapCalculationResult } from "../performance/calculateBeatmap";
import { App } from "./App";

export class AppConsole {
  private stdin = process.stdin;
  private stdout = process.stdout;
  private stderr = process.stderr;
  public app: App;

  constructor(app: App) {
    this.app = app;
  }

  printTitle() {
    const header = colors.bold(
      colors.rainbow(readFileSync("./title.txt", "utf8"))
    );

    return console.log(header);
  }

  printError(error: string) {
    const errorBox = `[ERROR]`.bgRed.black;

    return console.error(`${errorBox} ${error}`);
  }

  printSuccess(value: string) {
    const valueBox = `[SUCCESS]`.bgGreen.black;

    return console.log(`${valueBox} ${value}`);
  }

  printLog(value: string) {
    const valueBox = `[LOG]`.bgCyan.black;

    return console.log(`${valueBox} ${value}`);
  }

  printWarn(value: string) {
    const valueBox = `[WARNING]`.bgYellow.black;

    return console.log(`${valueBox} ${value}`);
  }

  printBeatmapStarRating(performance: BeatmapCalculationResult) {
    console.log(
      `${
        `${performance.beatmap.metadata.artist} - ${performance.beatmap.metadata.title} [${performance.beatmap.metadata.version}]`
          .bgCyan.black
      } >> ${
        "Star Rating".bgYellow.black
      }: ${performance.difficulty.starRating.toFixed(2)}`
    );
  }
}
