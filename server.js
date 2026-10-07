const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@as-integrations/express5");
const connectDB = require("./config/db");
const User = require("./models/User");
require("dotenv").config();

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

const startServer = async () => {
  await server.start();

  await connectDB();

  app.use(express.json());

  app.use("/graphql", expressMiddleware(server));

  app.listen(4000, () => {
    console.log("GraphQL server running on port 4000");
  });
};

startServer();