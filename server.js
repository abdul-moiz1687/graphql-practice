require("dotenv").config();

const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@as-integrations/express5");

const connectDB = require("./config/db");
const User = require("./models/User");

const app = express();

const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Query {
    users: [User!]!
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!

    updateUser(
      id: ID!
      name: String!
      email: String!
    ): User!

    deleteUser(id: ID!): User!
  }

  input CreateUserInput {
    name: String!
    email: String!
  }
`;

const resolvers = {
  Query: {
    users: async () => {
      return await User.find();
    },
  },

  Mutation: {
    createUser: async (_, args) => {
      const user = await User.create({
        name: args.input.name,
        email: args.input.email,
      });

      return user;
    },

    updateUser: async (_, args) => {
      const user = await User.findByIdAndUpdate(
        args.id,
        {
          name: args.name,
          email: args.email,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    },

    deleteUser: async (_, args) => {
      const user = await User.findByIdAndDelete(args.id);

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

let serverReady;

const initializeServer = async () => {
  if (!serverReady) {
    serverReady = (async () => {
      await server.start();

      await connectDB();

      app.use(express.json());

      app.use("/graphql", expressMiddleware(server));
    })();
  }

  return serverReady;
};

const handler = async (req, res) => {
  await initializeServer();

  return app(req, res);
};

module.exports = handler;

if (require.main === module) {
  initializeServer().then(() => {
    app.listen(process.env.PORT || 4000, "0.0.0.0", () => {
      console.log("GraphQL server running");
    });
  });
}