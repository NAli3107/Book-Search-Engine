const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = User.findOne({ _id: context.user._id }).select(
          "-__v-password"
        );
        console.log(userData, "from query in resolvers")
        return userData;
      }
      throw new AuthenticationError("You need to be logged in!");
    },
  },

  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("No user found with this email address");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const token = signToken(user);
      console.log(token, user);
      return { token, user };
    },
    saveBook: async (parent, { book }, context) => {
      console.log(book, context.user, "from saveBook in resolver");
      if (context.user) {
        const newBooks = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $push: { savedBooks: book } },
          { new: true }
        );

        return newBooks;
      }
      throw new AuthenticationError("You need to be logged in!");
    },
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const removeBooks = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        );
        return removeBooks;
      }
    },
  },
};

module.exports = resolvers;
