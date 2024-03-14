import env from "env-var";

export default {
  rocketchat: {
    user: env.get("USER").default("nir").asString(),
    pass: env.get("PASSWORD").default("nir").asString(),
    adminId: env.get("ADMIN_ID").default("Pa9JjdKjMNKky3ETc").asString(),
    dbName: env.get("DB_NAME").default("rocketchat").asString(),
  },
  kafka: {
    topics: env
      .get("TOPICS")
      .default(
        "rocketchat.rocketchat_message,rocketchat.rocketchat_room,rocketchat.users"
      )
      .asArray(),
    clientId: env.get("CLIENT_ID").default("db-consumer").asString(),
    brokers: env.get("BROKERS").default("localhost:9092").asArray(),
    groupId: env.get("GROUP_ID").default("rocketchat-consumer").asString(),
  },
  messages: {
    welcomeMessageText: env
      .get("WELCOME_MESSAGE_TEXT")
      .default("welcome kid")
      .asString(),
    messageAlias: env.get("MESSAGE_ALIAS").default("כלב").asString(),
  },
};
