import config from "./config.js";

let wordsCount = new Map();

const handleMessageEdit = async (jsonMessage) => {
  const fullpost = await api.get(
    "chat.getMessage?msgId=" + jsonMessage.documentKey._id
  );
  const fullroom = await api.get("rooms.info?roomId=" + fullpost.message.rid);

  if (
    jsonMessage.updateDescription.updatedFields.editedBy.username !==
    fullpost.message.u.username
  ) {
    await api.post("chat.postMessage", {
      channel: "@" + fullpost.message.u.username,
      text:
        jsonMessage.updateDescription.updatedFields.editedBy.username +
        " edited your text in room " +
        fullroom.room.fname,
      alias: config.messages.messageAlias,
    });
  }
};

const handleNewUser = async (jsonMessage) => {
  const fulluser = await api.get(
    "users.info?userId=" + jsonMessage.fullDocument._id
  );

  await api.post("chat.postMessage", {
    channel: "@" + fulluser.user.username,
    text: config.messages.welcomeMessageText,
    alias: config.messages.messageAlias,
  });
};

const handleRoomName = async (jsonMessage) => {
  const roomName =
    jsonMessage.operationType === "update"
      ? jsonMessage.updateDescription.updatedFields.fname
      : jsonMessage.fullDocument.fname;
  const roomNamesRegex = /cat|black/;

  if (roomNamesRegex.test(roomName)) {
    const newRoomName = roomName.split("").reverse().join("");
    const roomId = jsonMessage.documentKey._id;

    await api.post("rooms.saveRoomSettings", {
      rid: roomId,
      roomName: newRoomName,
    });
  }
};

const handleMessageSent = (jsonMessage) => {
  const userMessage = jsonMessage.fullDocument.msg;

  for (const word of userMessage.split(" ")) {
    wordsCount.set(word, wordsCount.has(word) ? wordsCount.get(word) + 1 : 1);
  }

  if (
    userMessage === "log popular word" &&
    jsonMessage.fullDocument.u._id === config.rocketchat.adminId
  ) {
    console.log({
      mostPopularWord: getMostPopularWord(),
    });
  } else {
    console.log({
      value: userMessage,
    });
  }
};

const getMostPopularWord = () => {
  return Array.from(wordsCount.entries()).reduce((a, b) =>
    a[1] < b[1] ? b : a
  )[0];
};


export {
    handleMessageEdit,
    handleMessageSent,
    handleNewUser,
    handleRoomName
}