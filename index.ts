import { existsSync, readFileSync, writeFileSync } from "fs";
import { calculateBeatmap, decodeBeatmap } from "./calculateBeatmap";
import {
  printError,
  printHeader,
  printSuccess,
  printWarn,
} from "./consoleHelpers";
import { checkUpdates } from "./updater";
import net from "net";

checkUpdates().then((v) => {
  if (v) return;

  printHeader();

  printWarn("Starting osu! connection...");

  const server = net.createServer((socket) => {
    socket.on("data", (data) => {
      try {
        let str = data.slice(4);

        const message = JSON.parse(str.toString("utf-8"));

        if (!message.Value) return fallbackValue(socket);

        if (
          message.Value.MessageType == "LegacyIpcDifficultyCalculationRequest"
        )
          calculateFor(message.Value, socket);
      } catch (e) {
        printError("Invalid message!");

        console.log(e);

        fallbackValue(socket);
      }

      socket.on("error", function (err) {
        printError("Execution exeption!");
        console.log(err.stack, err.message);

        fallbackValue(socket);
      });

      function fallbackValue(socket: net.Socket) {
        socket.write(
          generateBytes(
            JSON.stringify({
              Type: "System.Object",
              Value: {
                MessageType: "LegacyIpcDifficultyCalculationResponse",
                MessageData: {
                  StarRating: 5,
                },
              },
            }).replace(/\\/g, "")
          )
        );
      }
    });
  });

  server.listen(45357, "127.0.0.1");

  server.on("listening", () => {
    printSuccess("Connected to osu!");
  });

  interface IOsuCalculationMessage {
    MessageType: "LegacyIpcDifficultyCalculationRequest";
    MessageData: {
      BeatmapFile: string;
      RulesetId: number;
      Mods: number;
    };
  }

  function calculateFor(message: IOsuCalculationMessage, socket: net.Socket) {
    const file = readFileSync(message.MessageData.BeatmapFile, "utf8");

    const performance = calculateBeatmap(
      file,
      message.MessageData.RulesetId,
      message.MessageData.Mods
    );

    const dataString = JSON.stringify({
      Type: "System.Object",
      Value: {
        MessageType: "LegacyIpcDifficultyCalculationResponse",
        MessageData: {
          StarRating: performance.difficulty.starRating,
        },
      },
    }).replace(/\\/g, "");

    socket.write(generateBytes(dataString));

    console.log(
      `${
        `${performance.beatmap.metadata.artist} - ${performance.beatmap.metadata.title} [${performance.beatmap.metadata.version}]`
          .bgCyan.black
      } >> ${
        "Star Rating".bgYellow.black
      }: ${performance.difficulty.starRating.toFixed(2)}`
    );
  }
});

function generateBytes(text: string) {
  let ssidByteArray = [] as number[];
  let buffer = Buffer.from(text);

  ssidByteArray = ssidByteArray.concat([buffer.byteLength, 0, 0, 0]);

  for (var i = 0; i < buffer.length; i++) {
    ssidByteArray.push(buffer[i]);
  }

  const response = Buffer.from(ssidByteArray);

  return response;
}
