import { existsSync, readFileSync } from "fs";
import net from "net";
import { App } from "../cli/App";
import { calculateBeatmap } from "../performance/calculateBeatmap";

/// ? This class manages connection between osu!stable via IPC sockets
export namespace LegacyIpcManager {
  export interface ILegacyIpcMessage<T = unknown> {
    Type: "System.Object";
    Value: T;
  }

  export enum LegacyIpcMessageType {
    DifficultyCalculationRequest = "LegacyIpcDifficultyCalculationRequest",
    DifficultyCalculationResponse = "LegacyIpcDifficultyCalculationResponse",
  }

  export interface ILegacyIpcDifficultyCalculationRequest
    extends ILegacyIpcMessage {
    Value: {
      MessageType: LegacyIpcMessageType.DifficultyCalculationRequest;
      MessageData: {
        BeatmapFile: string;
        RulesetId: number;
        Mods: number;
      };
    };
  }

  export class Client {
    private server: net.Server;
    private connection!: net.Socket;

    public app: App;

    constructor(app: App) {
      this.app = app;

      this.server = net.createServer((socket) =>
        this.listener.bind(this)(socket)
      );
    }

    public listen() {
      this.app.console.printWarn(
        "(LegacyIpcManager) Starting LegacyIpc Server"
      );

      this.server.listen(45357, "127.0.0.1", undefined, () =>
        this.app.console.printSuccess(
          "(LegacyIpcManager) LegacyIpc Server started!"
        )
      );

      this.server.on(
        "connection",
        (connection) => (this.connection = connection)
      );
    }

    private handleDifficultyCalculationRequest(
      data: ILegacyIpcDifficultyCalculationRequest
    ) {
      const { MessageData } = data.Value;

      this.app.console.printLog(
        "(LegacyIpcManager) Requested beatmap calculation"
      );

      /// * We need to send response back to osu!stable or it will be stuck
      if (!existsSync(MessageData.BeatmapFile)) {
        this.fallbackDifficultyCalculation();

        return this.app.console.printError(
          "(LegacyIpcManager) Client requested difficulty calculation for a deleted beatmap!"
        );
      }

      const calculationResult = calculateBeatmap(
        readFileSync(MessageData.BeatmapFile, "utf8"),
        MessageData.RulesetId,
        MessageData.Mods
      );

      this.sendDifficultyCalculationResponse(
        calculationResult.difficulty.starRating
      );
    }

    private fallbackDifficultyCalculation() {
      this.connection.write(
        this.generateBytes(this.createDifficultyCalculationResponse(0))
      );

      this.app.console.printWarn(
        "(LegacyIpcManager) Something went wrong! Fallbacking beatmap calculation"
      );
    }

    private sendDifficultyCalculationResponse(starRating: number) {
      this.connection.write(
        this.generateBytes(this.createDifficultyCalculationResponse(starRating))
      );

      this.app.console.printSuccess("(LegacyIpcManager) Beatmap calculated!");
    }

    private createDifficultyCalculationResponse(starRating: number) {
      return this.sanitizeJson(
        JSON.stringify({
          Type: "System.Object",
          Value: {
            MessageType: LegacyIpcMessageType.DifficultyCalculationResponse,
            MessageData: {
              StarRating: starRating,
            },
          },
        })
      );
    }

    /// * remove backslash from json string
    public sanitizeJson(json: string) {
      return json.replace(/\\"/g, '"');
    }

    public decodeData(data: Buffer) {
      /// ? First 4 bytes is the content size data
      /// ? Last N bytes is the message content
      /// * REF: https://github.com/ppy/osu-framework/blob/master/osu.Framework/Platform/TcpIpcProvider.cs#L170-L179
      /// * we need to remove it to parse as JSON
      /// TODO: Remove deprecated method `slice`

      const buffer = data.slice(4);

      try {
        const message = JSON.parse(
          buffer.toString("utf-8")
        ) as ILegacyIpcDifficultyCalculationRequest; /// * Try to parse it

        return message;
      } catch (e: any) {
        this.app.console.printError(
          "(LegacyIpcManager) Invalid IPC message content!"
        );

        return null;
      }
    }

    /// * Add 4 bytes of message size to the buffer object
    public generateBytes(text: string) {
      let ssidByteArray = [] as number[];
      let buffer = Buffer.from(text);

      ssidByteArray = ssidByteArray.concat([buffer.byteLength, 0, 0, 0]);

      for (var i = 0; i < buffer.length; i++) {
        ssidByteArray.push(buffer[i]);
      }

      const response = Buffer.from(ssidByteArray);

      return response;
    }

    private socketDataListener(data: Buffer) {
      const message = this.decodeData(data);

      if (!message)
        return this.app.console.printWarn(
          "(LegacyIpcManager) Message content is null. Ignoring it..."
        );

      /// ? We just accept difficulty calculation requests
      if (
        message.Value.MessageType !=
        LegacyIpcMessageType.DifficultyCalculationRequest
      )
        return this.app.console.printError(
          "(LegacyIpcManager) Invalid message from osu!stable"
        );

      this.handleDifficultyCalculationRequest(message);
    }

    private listener(socket: net.Socket) {
      this.connection = socket;

      const callback = this.socketDataListener.bind(this);

      socket.on("data", callback);
    }
  }
}
