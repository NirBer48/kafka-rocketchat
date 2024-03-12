import { Kafka } from "kafkajs";
import { api } from "@rocket.chat/sdk";
import config from "./config.js";
import {
  handleMessageEdit,
  handleMessageSent,
  handleNewUser,
  handleRoomName,
} from "./handlers.js";

api.login({ username: config.rocketchat.user, password: config.rocketchat.pass });

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers,
});

const consumer = kafka.consumer({ groupId: config.kafka.groupId });

const runConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topics: config.kafka.topics, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const jsonMessage = JSON.parse(
        JSON.parse(JSON.stringify(message.value.toString().substring(7)))
      );

      switch (topic) {
        case "rocketchat.rocketchat_message":
          if (jsonMessage.operationType === "insert") {
            handleMessageSent(jsonMessage);
          } else if (
            jsonMessage.operationType === "update" &&
            jsonMessage.updateDescription.updatedFields.editedBy
          ) {
            await handleMessageEdit(jsonMessage);
          }

          break;
        case "rocketchat.users":
          if (jsonMessage.operationType === "insert") {
            await handleNewUser(jsonMessage);
          }

          break;
        case "rocketchat.rocketchat_room":
          if (
            jsonMessage.operationType === "insert" ||
            (jsonMessage.operationType === "update" &&
              "fname" in jsonMessage.updateDescription.updatedFields)
          ) {
            await handleRoomName(jsonMessage);
          }

          break;
        default: 
          break;
      }
    },
  });
};

runConsumer().catch(console.error);
