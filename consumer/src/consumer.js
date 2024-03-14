import { Kafka } from "kafkajs";
import config from "./config.js";
import {
  handleMessageEdit,
  handleMessageSent,
  handleNewUser,
  handleRoomName,
  tryCatchWrapper,
} from "./handlers.js";

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers,
});

const consumer = kafka.consumer({ groupId: config.kafka.groupId });

const runConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topics: config.kafka.topics, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, _partition, message }) => {
      const jsonMessage = JSON.parse(
        JSON.parse(JSON.stringify(message.value.toString().substring(7)))
      );

      switch (topic) {
        case config.rocketchat.dbName + ".rocketchat_message":
          if (jsonMessage.operationType === "insert") {
            tryCatchWrapper(handleMessageSent, jsonMessage);
          } else if (
            jsonMessage.operationType === "update" &&
            jsonMessage.updateDescription.updatedFields.editedBy
          ) {
            tryCatchWrapper(handleMessageEdit, jsonMessage);
          }

          break;
        case config.rocketchat.dbName + ".users":
          if (jsonMessage.operationType === "insert") {
            tryCatchWrapper(handleNewUser, jsonMessage);
          }

          break;
        case config.rocketchat.dbName + ".rocketchat_room":
          if (
            jsonMessage.operationType === "insert" ||
            (jsonMessage.operationType === "update" &&
              "fname" in jsonMessage.updateDescription.updatedFields)
          ) {
            tryCatchWrapper(handleRoomName, jsonMessage);
          }

          break;
        default: 
          break;
      }
    },
  });
};

runConsumer().catch(console.error);
