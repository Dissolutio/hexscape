import { BoardProps } from "boardgame.io/react";
import { ChatMessage } from "boardgame.io";
import {
  BgioClientInfoProvider,
  BgioGProvider,
  BgioMovesProvider,
  BgioEventsProvider,
  BgioCtxProvider,
  BgioChatProvider,
} from "./bgio-contexts";
import { HexscapePlayerView } from "ui";
import { MapContextProvider } from "contexts/MapContext";
import { UIContextProvider } from "contexts/UIContext";
import { PlacementContextProvider } from "contexts/PlacementPhaseContext";
import { PlayContextProvider } from "contexts/PlayPhaseContext";

type MyBoardProps = BoardProps & { chatMessages?: ChatMessage[] };

export function Board(props: MyBoardProps) {
  const {
    // G
    G,
    // CTX
    ctx,
    // MOVES
    moves,
    undo,
    redo,
    // EVENTS
    events,
    reset,
    // CHAT
    sendChatMessage,
    chatMessages = [],
    // ALSO ON BOARD PROPS
    playerID,
    log,
    matchID,
    matchData,
    isActive,
    isMultiplayer,
    isConnected,
    credentials,
  } = props;
  return (
    <BgioClientInfoProvider
      log={log}
      playerID={playerID || ""}
      matchID={matchID}
      matchData={matchData}
      credentials={credentials || ""}
      isMultiplayer={isMultiplayer}
      isConnected={isConnected}
      isActive={isActive}
    >
      <BgioGProvider G={G}>
        <BgioCtxProvider ctx={ctx}>
          <BgioMovesProvider moves={moves} undo={undo} redo={redo}>
            <BgioEventsProvider reset={reset} events={events}>
              <BgioChatProvider
                chatMessages={chatMessages}
                sendChatMessage={sendChatMessage}
              >
                <MapContextProvider>
                  <UIContextProvider>
                    <PlacementContextProvider>
                      <PlayContextProvider>
                        <HexscapePlayerView />
                      </PlayContextProvider>
                    </PlacementContextProvider>
                  </UIContextProvider>
                </MapContextProvider>
              </BgioChatProvider>
            </BgioEventsProvider>
          </BgioMovesProvider>
        </BgioCtxProvider>
      </BgioGProvider>
    </BgioClientInfoProvider>
  );
}
