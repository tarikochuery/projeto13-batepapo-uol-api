import express, { json } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { messageSchema, participantSchema } from './utils/validation.js';
import { getNowTime } from './utils/getNowTime.js';
import { validateParticipantLastStatus } from './utils/validateParticipantLastStatus.js';
import { generateEntryServerMessage, generateLeaveServerMessage } from './utils/serverMessageGenerator.js';
import { MongoClient } from 'mongodb';

dotenv.config();
const app = express();

const mongoClient = new MongoClient(process.env.MONGO_URL);
let db;

try {
  await mongoClient.connect();
  console.log('conectado ao banco de dados!');
} catch (error) {
  console.log(error.message);
}

db = mongoClient.db();

const PORT = 5000;

app.use(cors());
app.use(json());


app.post('/participants', async (req, res) => {
  const reqData = req.body;

  const { value: participantRegistered, error } = participantSchema.validate(reqData);

  if (error) return res.status(422).send(error.message);

  const isParticipantRegistered = !!(await db.collection('participants').findOne({ name: participantRegistered.name }));

  if (isParticipantRegistered) return res.sendStatus(409);

  await db.collection('participants').insertOne({ ...participantRegistered, lastStatus: Date.now() });

  await db.collection('messages').insertOne(generateEntryServerMessage(participantRegistered.name));

  res.sendStatus(201);

});

app.get('/participants', async (req, res) => {
  const participants = await db.collection('participants').find().toArray();
  res.send(participants);
});

app.post('/messages', async (req, res) => {
  const reqData = req.body;
  const { user } = req.headers;

  const { value: sentMessage, error } = messageSchema.validate(reqData);

  if (error) return res.status(422).send(error.message);

  //TODO: Buscar participant no banco de dados
  const isParticipantRegistered = !!(await db.collection('participants').findOne({ name: user }));

  if (!isParticipantRegistered) return res.sendStatus(422);

  const time = getNowTime();

  //TODO: Cadastrar no banco de dados
  await db.collection('messages').insertOne({ ...sentMessage, from: user, time });

  res.sendStatus(201);

});

// app.get('/messages', (req, res) => {
//   const { limit } = req.query;
//   const { user } = req.headers;

//   //TODO: Buscar no banco de dados
//   const filteredMessages = messages.filter(message => {
//     const isPublicMessage = message.type === 'message' || message.type === 'status';
//     const isPrivateMessageToUser = message.type === 'private_message' && message.to === user;

//     if (isPublicMessage) return true;

//     if (isPrivateMessageToUser) return true;

//     return false;
//   });

//   if (limit) {
//     return res.send(filteredMessages.slice(-limit));
//   }

//   return res.send(filteredMessages);
// });

// app.post('/status', (req, res) => {
//   const { user } = req.headers;

//   // TODO: Buscar no banco de dados
//   const userRegistered = participants.find(participant => participant.name === user);
//   if (!userRegistered) return res.sendStatus(404);

//   //TODO: Atualizar no banco de dados
//   userRegistered.lastStatus = Date.now();

//   res.sendStatus(200);

// });

// setInterval(() => {
//   participants.forEach(participant => {
//     const isParticipantExpired = validateParticipantLastStatus(participant);
//     if (isParticipantExpired) {
//       //TODO: adicionar mensagem no bando de dados
//       messages.push(generateLeaveServerMessage(participant.name));

//       //TODO: remover participante no banco de dados
//       participants = participants.filter(part => part.name !== participant.name);
//     }
//   });
// }, 15000);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});