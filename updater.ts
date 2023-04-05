import axios from "axios";
import { readFileSync } from "fs";

import { printError, printWarn } from "./consoleHelpers";

export function checkUpdates(): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    const currentPackageJson = JSON.parse(
      readFileSync("./package.json", "utf8")
    );

    const currentVersion = currentPackageJson.version;

    const liveVersionData = await axios(
      "https://raw.githubusercontent.com/Sebola3461/osu-sr-calculator/master/package.json"
    );

    if (liveVersionData.status != 200) {
      printError("Impossible to check for updates!");

      resolve(false);
    }

    const liveVersionJson = liveVersionData.data;

    if (liveVersionJson.version != currentVersion) {
      printWarn(
        "Update found! You need to update the program to continue. Please download the latest version here:\n\nhttps://github.com/Sebola3461/osu-sr-calculator/releases/download/Latest/osu-sr.zip"
      );

      resolve(true);
    } else {
      resolve(false);
    }
  });
}
