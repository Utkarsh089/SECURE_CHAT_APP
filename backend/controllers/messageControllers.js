const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const crypto = require("crypto");
const algorithm = "aes-256-cbc"; 

// generate 16 bytes of random data
const initVector = Buffer.alloc(16, 0);

// protected data
const message = "This is a secret message";

// secret key generate 32 bytes of random data
const Securitykey = Buffer.alloc(32, 0);

// the cipher function
console.log("HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH")
console.log(Securitykey);
console.log(initVector);

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    // console.log(messages);
    messages.forEach(message => {
          
    // the decipher function
    const decipher = crypto.createDecipheriv(algorithm, Securitykey, initVector);

    let decryptedData = decipher.update(message.content, "hex", "utf-8");
    console.log(decryptedData);
    decryptedData += decipher.final("utf8");

    message.content = decryptedData;
    })  
    res.json(messages);
  } catch (error) {
    console.log(error)
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }
  console.log(content);



  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {

    // encrypt the message
// input encoding
// output encoding
const cipher = crypto.createCipheriv(algorithm, Securitykey, initVector);

let encryptedData = cipher.update(content, "utf-8", "hex");
console.log("Encrypted data: " + encryptedData);

encryptedData += cipher.final("hex");

console.log("Encrypted message: " + encryptedData);
newMessage.content=encryptedData
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic").execPopulate();
    message = await message.populate("chat").execPopulate();
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });
            
    // the decipher function
    const decipher = crypto.createDecipheriv(algorithm, Securitykey, initVector);
    // console.log(message.content);
    let decryptedData = decipher.update(message.content, "hex", "utf-8");
    // console.log(decryptedData);
    decryptedData += decipher.final("utf8");

    // console.log("Decrypted message: " + decryptedData);
    message.content = decryptedData;
    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { allMessages, sendMessage };
