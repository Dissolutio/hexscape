import { useBgioClientInfo, useBgioG } from "bgio-contexts";
import { LeaveJoinedMatchButton } from "lobby/LeaveJoinedMatchButton";
import { ChatInput, ChatList } from "./Chat";
import { Controls } from "./Controls";
import { isLocalApp } from "App";
import { MultiplayerMatchPlayerList } from "./MultiplayerMatchPlayerList";
export const HexscapePlayerView = () => {
  const { playerID } = useBgioClientInfo();
  //   const {  } = useBgioG();
  return (
    <div>
      <h1>{`YOU are PLAYER-${playerID}`}</h1>
      <Controls />
      <MultiplayerMatchPlayerList />
      {!isLocalApp && <LeaveJoinedMatchButton />}
      <h3>Chats</h3>
      <ChatList />
      <ChatInput />
    </div>
  );
};
