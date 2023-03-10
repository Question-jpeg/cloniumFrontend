

export const sendReady = (socket: WebSocket, value: boolean) => {
    socket.send(JSON.stringify({ type: "player_ready", data: { value } }));
  };