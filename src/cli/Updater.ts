import axios from "axios";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import yauzl from "yauzl";
import { App } from "./App";

export class Updater {
  public app: App;
  private UPDATE_REF_URL =
    "https://raw.githubusercontent.com/Sebola3461/osu-sr-calculator/master/package.json";

  constructor(app: App) {
    this.app = app;
  }

  public async checkForUpdates() {
    this.app.console.printLog("Searching for updates...");

    const serverJson = await axios(this.UPDATE_REF_URL);

    if (serverJson.status != 200)
      return this.app.console.printError("Could not check for updates!");

    if (
      serverJson.data.version !=
      JSON.parse(readFileSync("./package.json", "utf8")).version
    )
      return this.downloadUpdate();

    this.app.console.printLog("You're running the latest version!");
  }

  async downloadUpdate() {
    this.app.console.printLog("Downloading a new version...");

    const file = await axios(
      "https://github.com/Sebola3461/osu-sr-calculator/releases/download/Latest/osu-sr.zip",
      {
        responseType: "arraybuffer",
      }
    );

    this.app.console.printLog("Moving update files...");

    if (!existsSync("./update/")) mkdirSync("./update/");

    writeFileSync("./update/update.zip", file.data); /// Save update file

    yauzl.open("./update/update.zip", { lazyEntries: true }, (err, zipfile) => {
      if (err) throw err;

      zipfile.readEntry();

      const createFolders = this.createFolders; /// * Prevent to bind inside callback function
      const console = this.app.console; /// * Prevent to bind inside callback function

      zipfile.on("entry", function (entry) {
        /// * Check if the entry is a folder
        if (entry.fileName.split("/").length != 1) {
          createFolders(
            entry.fileName
              .split("/")
              .filter((p: string) => p.trim() != "")
              .map((p: string) => p.trim())
          );
        }

        const destination = createWriteStream(
          (process.env.NODE_ENV == "development" ? "./dist/" : "").concat(
            entry.fileName
          )
        );

        if (/\/$/.test(entry.fileName)) {
          zipfile.readEntry();
        } else {
          zipfile.openReadStream(entry, function (err, readStream) {
            if (err) throw err;
            readStream.on("end", function () {
              zipfile.readEntry();
            });
            readStream.pipe(destination);
          });
        }
      });

      zipfile.on("end", function () {
        zipfile.close();

        unlinkSync("./update/update.zip"); /// Delete update package

        console.printSuccess("Update applied! Restart to use the new version.");
      });
    });
  }

  createFolders(paths: string[]) {
    paths.pop(); /// * remove filename from path

    const target = [] as string[];

    for (const path of paths) {
      target.push(path);

      const pathname =
        process.env.NODE_ENV == "development"
          ? `./dist/${target.join("/")}`
          : target.join("/");

      if (!existsSync(pathname)) mkdirSync(pathname);
    }
  }
}
