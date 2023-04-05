import colors from "colors";
import Table from "cli-table3";
import readline from "readline";

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

export function printHeader(text: string) {
  const header = colors.bold(colors.rainbow(`${text}`));

  return console.log(`<<< [${header}] >>>\n`);
}
