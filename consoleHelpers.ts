import colors from "colors";
import { readFileSync } from "fs";

export function generateInputBox(question: string) {
  const questionBox = `[${question}]`.bgCyan.black;

  return `${questionBox}: `;
}

export function printError(error: string) {
  const errorBox = `[ERROR]`.bgRed.black;

  return console.error(`${errorBox} ${error}`);
}

export function printSuccess(value: string) {
  const valueBox = `[SUCCESS]`.bgGreen.black;

  return console.log(`${valueBox} ${value}`);
}

export function printWarn(value: string) {
  const valueBox = `[WARNING]`.bgYellow.black;

  return console.log(`${valueBox} ${value}`);
}

export function printHeader() {
  const header = colors.bold(
    colors.rainbow(readFileSync("./title.txt", "utf8"))
  );

  return console.log(header);
}
