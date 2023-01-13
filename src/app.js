import express, { json } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { messageSchema, participantSchema } from './utils/validation.js';
import { getNowTime } from './utils/getNowTime.js';
import { validateParticipantLastStatus } from './utils/validateParticipantLastStatus.js';
import { generateEntryServerMessage, generateLeaveServerMessage } from './utils/serverMessageGenerator.js';
import { MongoClient } from 'mongodb';
import { COLLECTIONS, MESSAGES_TYPES, SECONDS_TO_MILISECONDS_MULTIPLIER, STATUS_LIMIT } from './utils/constants.js';

dotenv.config();
const app = express();

const mongoClient = new MongoClient(process.env.DATABASE_URL);
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

  const isParticipantRegistered = !!(await db.collection(COLLECTIONS.participants).findOne({ name: participantRegistered.name }));

  if (isParticipantRegistered) return res.sendStatus(409);

  await db.collection(COLLECTIONS.participants).insertOne({ ...participantRegistered, lastStatus: Date.now() });

  await db.collection(COLLECTIONS.messages).insertOne(generateEntryServerMessage(participantRegistered.name));

  res.sendStatus(201);

});

app.get('/participants', async (req, res) => {
  const participants = await db.collection(COLLECTIONS.participants).find().toArray();
  res.send(participants);
});

app.post('/messages', async (req, res) => {
  const reqData = req.body;
  const { user } = req.headers;

  const { value: sentMessage, error } = messageSchema.validate(reqData);

  if (error) return res.status(422).send(error.message);

  const isParticipantRegistered = !!(await db.collection(COLLECTIONS.participants).findOne({ name: user }));

  if (!isParticipantRegistered) return res.sendStatus(422);

  const time = getNowTime();

  await db.collection(COLLECTIONS.messages).insertOne({ ...sentMessage, from: user, time });

  res.sendStatus(201);

});

app.get('/messages', async (req, res) => {
  const { limit } = req.query;
  const { user } = req.headers;

  const filteredMessages = await db.collection(COLLECTIONS.messages).find({
    $or: [
      {
        type: MESSAGES_TYPES.public
      },
      {
        type: MESSAGES_TYPES.status
      },
      {
        to: user,
        type: MESSAGES_TYPES.private
      }
    ]
  }).toArray();

  if (limit) {
    return res.send(filteredMessages.slice(-limit));
  }

  return res.send(filteredMessages);
});

app.post('/status', async (req, res) => {
  const { user } = req.headers;

  const userRegistered = await db.collection(COLLECTIONS.participants).findOne({ name: user });
  if (!userRegistered) return res.sendStatus(404);

  await db.collection(COLLECTIONS.participants).updateOne({ name: user }, { $set: { lastStatus: Date.now() } });

  res.sendStatus(200);

});

setInterval(async () => {
  const statusLimit = Date.now() - STATUS_LIMIT * SECONDS_TO_MILISECONDS_MULTIPLIER;
  await db.collection(COLLECTIONS.participants).deleteMany({ lastStatus: { $lt: statusLimit } });

}, 15000);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});