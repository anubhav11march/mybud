const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const socketio = require('socket.io');
let { checkroom, addinroom, storeMessage,userunmatched } = require('./utils/chat');
const User=require('./models/usermodel');
const SocketModel=require('./models/socket');
const { Socket } = require('dgram');

const server = http.createServer(app);
const io = socketio(server);

app.use(express.json({ limit: '50mb' }));
app.use(cors({ limit: '50mb' }));

// Importing Routes
app.use('/user', require('./routes/user'));
app.use('/card', require('./routes/cards'));
app.use('/task',require('./routes/task'));
app.use('/admin',require('./routes/admin'));


const options = {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverSelectionTimeoutMS: 9000000,
	socketTimeoutMS: 9000000,
};
console.log(process.env.MONGOURI)
mongoose.connect(process.env.MONGOURI, options);
mongoose.connection.on('connected', () => {
	console.log('connected to database!');
});
mongoose.connection.on('error', (err) => {
	console.log('error in connection', err);
});


io.on('connection', (socket) => {
	console.log("New websocket connected!", socket);


	// whenever someone joins store or update their socketid in database
	socket.on('updatesocketid',async(userid)=>{
		let isMatch=await SocketModel.findOne({userid:mongoose.Types.ObjectId(userid)});
		if(!isMatch){
			let socketdata=new SocketModel({
				userid:mongoose.Types.ObjectId(userid),
				socketid:socket.id
			})
			await socketdata.save();
		}else{
			let updates={
				socketid:socket.id
			}
			await SocketModel.findOneAndUpdate({userid:mongoose.Types.ObjectId(userid)},{$set:updates});
		}
	})

	socket.on('privatemessage',async({user1,user2,message})=>{
			let socketdata=await SocketModel.findOne({userid:mongoose.Types.ObjectId(user2)});
			socket.to(socketdata.socketid).emit('privatemessage',message);
			await storeMessage(message, user1, user2);
	})


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

	// when one user unmatched the other
	socket.on('disconnect', async function (roomid) {
		console.log(' user unmatched ');
		await userunmatched(roomid);
		socket.broadcast.to(roomid).emit("userunmatched");
	});
})

server.listen(port, () => console.log(`app listening on port ${port}!`));