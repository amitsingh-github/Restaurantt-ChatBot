const SessionDB = require("../model/sessionModel");
const messageModel = require("../model/messageModel");
const formatMessage = require("../utils/message");
const { mainMenu, foodMenu } = require("../utils/mainmenu");
const formatArray = require("../utils/formatArray");
const { config } = require("../config/config");

const sendBotMessage = (io, sessionID, message) => {
    io.to(sessionID).emit("bot message", message);
};

const handleEmptyOrder = (io, sessionID, message) => {
    sendBotMessage(io, sessionID, formatMessage(config.botName, message));
    sendBotMessage(io, sessionID, formatMessage(config.botName, mainMenu));
};

exports.saveSessionID = async (sessionID) => {
    if (!await SessionDB.findOne({ sessionID })) {
        await SessionDB.create({ sessionID });
    }
};

exports.loadMessage = async (io, sessionID) => {
    const oldMessages = await messageModel.find({ sessionID });
    oldMessages.forEach(message => {
        io.to(message.sessionID).emit("user message", message.userMessage);
        io.to(message.sessionID).emit("bot message", message.botMessage);
    });
};

exports.welcomeMessage = (io, sessionID) => {
    sendBotMessage(io, sessionID, formatMessage(config.botName, "Welcome to Amit Kumar Celebal Tech Restaurant Bot Service! <br>Hi, How may I serve you today?"));
};

exports.mainMenu = (io, sessionID) => {
    const botMessage = formatMessage(config.botName, formatArray("mainMenu", mainMenu));
    sendBotMessage(io, sessionID, botMessage);
    return botMessage;
};

exports.menu = (io, sessionID) => {
    const botMessage = formatMessage(config.botName, formatArray("Select One Item To Add to Your Cart", foodMenu));
    sendBotMessage(io, sessionID, botMessage);
    return botMessage;
};

exports.checkOutOrder = async (io, sessionID) => {
    const sessionOrder = await SessionDB.findOne({ sessionID });

    if (sessionOrder.currentOrder.length < 1) {
        handleEmptyOrder(io, sessionID, "You have not ordered anything yet!");
    } else {
        sessionOrder.placedOrder.push(...sessionOrder.currentOrder);
        sessionOrder.currentOrder = [];
        await sessionOrder.save();

        const botMessage = formatMessage(config.botName, "Order Placed Successfully!");
        sendBotMessage(io, sessionID, botMessage);
        sendBotMessage(io, sessionID, formatMessage(config.botName, mainMenu));
    }
};

exports.orderHistory = async (io, sessionID) => {
    const sessionOrder = await SessionDB.findOne({ sessionID });

    const botMessage = sessionOrder.placedOrder.length < 1
        ? formatMessage(config.botName, "You do not have any order history yet!")
        : formatMessage(config.botName, formatArray("Your Order History", sessionOrder.placedOrder));

    sendBotMessage(io, sessionID, botMessage);
    sendBotMessage(io, sessionID, formatMessage(config.botName, mainMenu));

    return botMessage;
};

exports.currentOrder = async (io, sessionID) => {
    const sessionOrder = await SessionDB.findOne({ sessionID });

    const botMessage = sessionOrder.currentOrder.length < 1
        ? formatMessage(config.botName, "You do not have any order yet!")
        : formatMessage(config.botName, formatArray("Your Current Order", sessionOrder.currentOrder));

    sendBotMessage(io, sessionID, botMessage);
    sendBotMessage(io, sessionID, formatMessage(config.botName, mainMenu));

    return botMessage;
};

exports.cancelOrder = async (io, sessionID) => {
    const sessionOrder = await SessionDB.findOne({ sessionID });

    if (sessionOrder.currentOrder.length < 1) {
        handleEmptyOrder(io, sessionID, "You do not have any order yet!");
    } else {
        sessionOrder.currentOrder = [];
        await sessionOrder.save();

        const botMessage = formatMessage(config.botName, "Order Cancelled!");
        sendBotMessage(io, sessionID, botMessage);
        sendBotMessage(io, sessionID, formatMessage(config.botName, mainMenu));
    }
};

exports.saveOrder = async (io, sessionID, number) => {
    const sessionOrder = await SessionDB.findOne({ sessionID });
    const item = foodMenu[number - 1];

    if (item) {
        sessionOrder.currentOrder.push(item);
        await sessionOrder.save();

        const botMessage = formatMessage(config.botName, formatArray("Order Added", sessionOrder.currentOrder));
        sendBotMessage(io, sessionID, botMessage);
        sendBotMessage(io, sessionID, formatMessage(config.botName, mainMenu));

        return botMessage;
    } else {
        const botMessage = formatMessage(config.botName, "Invalid item number. Please select a valid item.");
        sendBotMessage(io, sessionID, botMessage);
        return botMessage;
    }
};
