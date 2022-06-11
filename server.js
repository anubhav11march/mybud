const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const socketio = require('socket.io');
let { storeMessage, deleteSocket, getMessages } = require('./utils/chat');
const User = require('./models/usermodel');
const SocketModel = require('./models/socket');
const { Socket } = require('dgram');
const port = process.env.PORT || 6000;

const server = http.createServer(app);
const io = socketio(server);

app.use(express.json({ limit: '50mb' }));
app.use(cors({ limit: '50mb' }));

// Importing Routes
app.use('/user', require('./routes/user'));
app.use('/card', require('./routes/cards'));
app.use('/task', require('./routes/task'));
app.use('/admin', require('./routes/admin'));
app.use('/challenge', require('./routes/challenges'));

// Importing Scripts
require('./utils/script');

const options = {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverSelectionTimeoutMS: 9000000,
	socketTimeoutMS: 9000000,
};

mongoose.connect(process.env.MONGOURI, options);
mongoose.connection.on('connected', () => {
	console.log('connected to database!');
});
mongoose.connection.on('error', (err) => {
	console.log('error in connection', err);
});

io.on('connection', (socket) => {
	// console.log("New websocket connected!", socket);

	// whenever someone joins store or update their socketid in database
	socket.on('updatesocketid', async ({ userid, matcheduser }) => {
		console.log('hello', userid);
		// console.log('hello',matcheduser);
		let isMatch = await SocketModel.findOne({
			userid: mongoose.Types.ObjectId(userid),
		});
		if (!isMatch) {
			let socketdata = new SocketModel({
				userid: mongoose.Types.ObjectId(userid),
				socketid: socket.id,
			});
			await socketdata.save();
		} else {
			let updates = {
				socketid: socket.id,
			};
			await SocketModel.findOneAndUpdate(
				{ userid: mongoose.Types.ObjectId(userid) },
				{ $set: updates }
			);
		}

		let messages = await getMessages(userid, matcheduser);
		let socketdata = await SocketModel.findOne({
			userid: mongoose.Types.ObjectId(userid),
		});
		console.log('hghg', socketdata);
		if (socketdata) {
			console.log('ghc', messages);
			socket.emit('getmessage', messages);
		}
		//let messages = await getMessages(userid); //getting messages of the user who has joined .
		// socket.emit('messages', messages);
	});

	socket.on('privatemessage', async ({ user1, user2, message }) => {
		console.log('inside', user1, user2, message);
		await storeMessage(message, user1, user2);
		let socketdata = await SocketModel.findOne({
			userid: mongoose.Types.ObjectId(user2),
		});
		if (socketdata) {
			console.log('ok', message);
			// if only one is online then only send him the message otherwise just store his messages.
			socket.to(socketdata.socketid).emit('privatemessage', message);
		}
	});

	// socket.on('getmessage',async({user,matcheduser})=>{
	// 	console.log('we inside ',user)
	// 	let messages=await getMessages(user,matcheduser);
	// 	// console.log('gfhgh',messages);
	// 	let socketdata = await SocketModel.findOne({ userid: mongoose.Types.ObjectId(user) });
	// 	console.log('hghg',socketdata)
	// 	if(socketdata){
	// 		socket.to(socketdata.socketid).emit('getmessage',messages);
	// 	}

	// })

	// adding a user into a room
	// socket.on('addinroom', async (member, roomid) => {
	// 	let status = await checkroom(roomid);
	// 	if (status.error) {
	// 		let errmsg = { error: status.error };
	// 		socket.broadcast.to(roomid).emit('error', errmsg);
	// 	}
	// 	let { error } = await addinroom(member, roomid);
	// 	if (error) {
	// 		let errmsg = { error };
	// 		socket.broadcast.to(roomid).emit('error', errmsg);
	// 	}
	// 	socket.join(roomid);
	// })

	// recieving and then sending the message
	// socket.on('message', async (message, roomid, sender, reciever) => {
	// 	await storeMessage(message, roomid, sender, reciever);
	// 	socket.broadcast.to(roomid).emit('message', message);
	// })

	socket.on('disconnect', async function () {
		console.log('disconnected');
		// when user goes offline delete his socketid from db so that we can know which user is online or offline
		await deleteSocket(socket.id);
	});
});

server.listen(port, () => console.log(`app listening on port ${port}!`));
