const { Kafka } = require("kafkajs");
const axios = require("axios");
const { api } = require("@rocket.chat/sdk");

const HOST = "http://localhost:3000/";
const USER = "nir";
const PASS = "nir";

api.login({ username: USER, password: PASS });

let wordsCount = new Map();

const kafka = new Kafka({
  clientId: "db-comsumer",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "rocketchat-consumer" });

const topics = [
  "rocketchat.rocketchat_message",
  "rocketchat.rocketchat_room",
  "rocketchat.users",
];

const runConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topics: topics, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const jsonMessage = JSON.parse(
        JSON.parse(JSON.stringify(message.value.toString().substring(7)))
      );

      if (
        topic === "rocketchat.rocketchat_message" &&
        jsonMessage.operationType === "insert"
      ) {
        const userMessage = jsonMessage.fullDocument.msg;

        for (const word of userMessage.split(" ")) {
          wordsCount.has(word)
            ? wordsCount.set(word, wordsCount.get(word) + 1)
            : wordsCount.set(word, 1);
        }

        if (
          userMessage === "log popular word" &&
          jsonMessage.fullDocument.u._id === "Pa9JjdKjMNKky3ETc"
        ) {
          console.log({
            mostPopularWord: Array.from(wordsCount.entries()).reduce((a, b) =>
              a[1] < b[1] ? b : a
            )[0],
          });
        } else {
          console.log({
            value: userMessage,
          });
        }
      } else if (
        topic === "rocketchat.rocketchat_room" &&
        (jsonMessage.operationType === "insert" ||
          (jsonMessage.operationType === "update" &&
            "fname" in jsonMessage.updateDescription.updatedFields))
      ) {
        await handleRoomName(jsonMessage)
      } else if (
        topic === "rocketchat.users" &&
        jsonMessage.operationType === "insert"
      ) {
        await handleNewUser(jsonMessage);
      } else if (
        topic === "rocketchat.rocketchat_message" &&
        jsonMessage.operationType === "update" &&
        jsonMessage.updateDescription.updatedFields.editedBy
      ) {
        await handleMessageEdit(jsonMessage);
      }
    },
  });
};

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
      alias: "כלב",
    });
  }
};

const handleNewUser = async (jsonMessage) => {
  const fulluser = await api.get(
    "users.info?userId=" + jsonMessage.fullDocument._id
  );

  await api.post("chat.postMessage", {
    channel: "@" + fulluser.user.username,
    text: "welcome kid",
    alias: "כלב",
  });
};

const handleRoomName = async () => {
  const roomName =
    jsonMessage.operationType === "update"
      ? jsonMessage.updateDescription.updatedFields.fname
      : jsonMessage.fullDocument.fname;
  if (/cat|black/.test(roomName)) {
    const newRoomName = roomName.split("").reverse().join("");
    const roomId = jsonMessage.documentKey._id;

    await api.post("rooms.saveRoomSettings", {
      rid: roomId,
      roomName: newRoomName,
    });
  }
};

runConsumer().catch(console.error);
