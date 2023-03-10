import express, { json } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getMessagesSchema, messageSchema, participantSchema } from './utils/validation.js';
import { getNowTime } from './utils/getNowTime.js';
import { generateEntryServerMessage, generateLeaveServerMessage } from './utils/serverMessageGenerator.js';
import { MongoClient, ObjectId } from 'mongodb';
import { COLLECTIONS, MESSAGES_TYPES, SECONDS_TO_MILISECONDS_MULTIPLIER, STATUS_LIMIT } from './utils/constants.js';
import { stripHtml } from 'string-strip-html';

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

  const { value, error } = participantSchema.validate(reqData);

  if (error) return res.status(422).send(error.message);

  const participantRegistered = stripHtml(value.name).result.trim();

  const isParticipantRegistered = !!(await db.collection(COLLECTIONS.participants).findOne({ name: participantRegistered }));

  if (isParticipantRegistered) return res.sendStatus(409);

  await db.collection(COLLECTIONS.participants).insertOne({ name: participantRegistered, lastStatus: Date.now() });

  await db.collection(COLLECTIONS.messages).insertOne(generateEntryServerMessage(participantRegistered));

  res.sendStatus(201);

});

app.get('/participants', async (req, res) => {
  const participants = await db.collection(COLLECTIONS.participants).find().toArray();
  res.send(participants);
});

app.post('/messages', async (req, res) => {
  const reqData = req.body;
  const { user } = req.headers;

  const { value, error } = messageSchema.validate(reqData);

  if (error) return res.status(422).send(error.message);

  const sentMessage = {
    ...value,
    text: stripHtml(value.text).result.trim()
  };

  const isParticipantRegistered = !!(await db.collection(COLLECTIONS.participants).findOne({ name: user }));

  if (!isParticipantRegistered) return res.sendStatus(422);

  const time = getNowTime();

  await db.collection(COLLECTIONS.messages).insertOne({ ...sentMessage, from: user, time });

  res.sendStatus(201);

});

app.get('/messages', async (req, res) => {
  const { limit } = req.query;
  const { user } = req.headers;

  const { value: validLimit, error } = getMessagesSchema.validate(limit);

  if (error) return res.status(422).send(error.message);

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
      },
      {
        type: MESSAGES_TYPES.private,
        from: user
      }
    ]
  }).toArray();

  if (validLimit) {
    return res.send(filteredMessages.slice(-validLimit).reverse());
  }

  return res.send(filteredMessages.reverse());
});

app.post('/status', async (req, res) => {
  const { user } = req.headers;

  const userRegistered = await db.collection(COLLECTIONS.participants).findOne({ name: user });
  if (!userRegistered) return res.sendStatus(404);

  await db.collection(COLLECTIONS.participants).updateOne({ name: user }, { $set: { lastStatus: Date.now() } });

  res.sendStatus(200);

});

app.delete('/messages/:ID_DA_MENSAGEM', async (req, res) => {
  const { user } = req.headers;
  const { ID_DA_MENSAGEM } = req.params;
  const messageToBeDeleted = await db.collection(COLLECTIONS.messages).findOne({ _id: ObjectId(ID_DA_MENSAGEM) });

  if (!messageToBeDeleted) return res.sendStatus(404);
  if (messageToBeDeleted.from !== user) return res.sendStatus(401);

  await db.collection(COLLECTIONS.messages).deleteOne({ _id: ObjectId(ID_DA_MENSAGEM) });

  res.sendStatus(200);
});

app.put('/messages/:ID_DA_MENSAGEM', async (req, res) => {
  const { ID_DA_MENSAGEM } = req.params;
  const { user } = req.headers;
  const bodyData = req.body;

  const messageToBeUpdated = await db.collection(COLLECTIONS.messages).findOne({ _id: ObjectId(ID_DA_MENSAGEM) });
  if (!messageToBeUpdated) return res.sendStatus(404);
  if (messageToBeUpdated.from !== user) return res.sendStatus(401);

  const { value, error } = messageSchema.validate(bodyData);

  if (error) return res.status(422).send(error.message);

  const newMessage = {
    ...value,
    text: stripHtml(value.text).result
  };

  await db.collection(COLLECTIONS.messages).updateOne({
    _id: ObjectId(ID_DA_MENSAGEM)
  },
    {
      $set:
      {
        ...newMessage
      }
    });

  res.sendStatus(200);

});

setInterval(async () => {
  const statusLimit = Date.now() - STATUS_LIMIT * SECONDS_TO_MILISECONDS_MULTIPLIER;
  const participantsToKick = await db.collection(COLLECTIONS.participants).find({ lastStatus: { $lt: statusLimit } }).toArray();
  participantsToKick.forEach(async participant => {
    await db.collection(COLLECTIONS.messages).insertOne(generateLeaveServerMessage(participant.name));
  });
  await db.collection(COLLECTIONS.participants).deleteMany({ lastStatus: { $lt: statusLimit } });

}, 15000);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});