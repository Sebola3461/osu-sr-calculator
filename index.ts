import { existsSync, readFileSync } from "fs";
import readline from "readline";
import { calculateBeatmap, decodeBeatmap } from "./calculateBeatmap";
import {
  printError,
  generateInputBox,
  printHeader,
  printSuccess,
} from "./consoleHelpers";
import { relativeTime } from "./relativeTime";
import { checkUpdates } from "./updater";

checkUpdates().then((v) => {
  if (v) return;

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  printHeader("osu! Star Rating Calculator");

  function requestBeatmap() {
    rl.question(generateInputBox("OSU File Path"), function (path) {
      path = path.trim().replace(/\\/g, "/");

      if (!existsSync(path)) {
        printError("Beatmap File Not Found!");

        return requestBeatmap();
      }

      rl.pause();
      rl.close();

      console.clear();

      startPrintSR(path);
    });
  }

  function startPrintSR(path: string) {
    printHeader("osu! Star Rating Calculator");

    printSuccess("Beatmap Found! Calculating star rating...\n");

    let lastUpdate = new Date();
    let lastSr = 0;
    setInterval(() => {
      const file = readFileSync(path, "utf8");

      const beatmapInfo = decodeBeatmap(file);

      const performance = calculateBeatmap(file, beatmapInfo.mode);

      if (performance.difficulty.starRating != lastSr) {
        lastUpdate = new Date();
        lastSr = performance.difficulty.starRating;
      }

      process.stdout.write(
        `${performance.beatmap.metadata.version.bgMagenta.black} >> ${
          "Star Rating".bgYellow.black
        }: ${performance.difficulty.starRating.toFixed(
          2
        )} >> Updated ${relativeTime(lastUpdate)} ago\r`
      );
    }, 5000);
  }

  requestBeatmap();
});
