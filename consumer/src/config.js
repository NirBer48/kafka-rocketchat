import env from "env-var";

export default {
  USER: env.get("USER").default("nir").asString(),
  PASS: env.get("PASSWORD").default("nir").asString(),
  ADMIN_ID: env.get("ADMIN_ID").default("Pa9JjdKjMNKky3ETc").asString(),
  CLIENT_ID: env.get("CLIENT_ID").default("db-consumer").asString(),
  TOPICS: env
    .get("TOPICS")
    .default(
      "rocketchat.rocketchat_message,rocketchat.rocketchat_room,rocketchat.users"
    )
    .asArray(),
  BROKERS: env.get("BROKERS").default("localhost:9092").asArray(),
  GROUP_ID: env.get("GROUP_ID").default("rocketchat-consumer").asString(),
  WELCOME_MESSAGE_TEXT: env
    .get("WELCOME_MESSAGE_TEXT")
    .default("welcome kid")
    .asString(),
  MESSAGE_ALIAS: env.get("MESSAGE_ALIAS").default("כלב").asString(),
};
