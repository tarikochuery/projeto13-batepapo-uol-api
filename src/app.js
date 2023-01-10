import express, { json } from 'express';
import cors from 'cors';
import { messageSchema, participantSchema } from './utils/validation.js';
import { getNowTime } from './utils/getNowTime.js';

const app = express();

app.use(cors());
app.use(json());

const PORT = 5000;

// TODO: registrar collections no banco de dados
const participants = [];
const messages = [];

app.post('/participants', (req, res) => {
  const reqData = req.body;

  const { value: participantRegistered, error } = participantSchema.validate(reqData);

  if (error) return res.status(422).send(error.message);

  //TODO: Fazer busca no banco de dados
  const isParticipantRegistered = !!participants.find(participant => participant.name === participantRegistered.name);

  if (isParticipantRegistered) return res.sendStatus(409);

  //TODO: Fazer cadastro no banco de dados (nome da collection deve ser participants)
  participants.push({ ...participantRegistered, lastStatus: Date.now() });
  res.sendStatus(201);

});

app.get('/participants', (req, res) => {
  //TODO: Localizar no banco de dados
  res.send(participants);
});

app.post('/messages', (req, res) => {
  const reqData = req.body;
  const { user } = req.headers;

  const { value: sentMessage, error } = messageSchema.validate(reqData);

  if (error) return res.status(422).send(error.message);

  //TODO: Buscar participant no banco de dados
  const isParticipantRegistered = !!participants.find(participant => participant.name === user);

  if (!isParticipantRegistered) return res.sendStatus(422);

  const time = getNowTime();

  //TODO: Cadastrar no banco de dados
  messages.push({ ...sentMessage, from: user, time });

  res.sendStatus(201);

});

app.get('/messages', (req, res) => {
  const { limit } = req.query;
  const { user } = req.headers;

  //TODO: Buscar no banco de dados
  const filteredMessages = messages.filter(message => {
    const isPublicMessage = message.type === 'message';
    const isPrivateMessageToUser = message.type === 'private_message' && message.to === user;

    if (isPublicMessage) return true;

    if (isPrivateMessageToUser) return true;

    return false;
  });

  if (limit) {
    return res.send(filteredMessages.slice(-limit));
  }

  return res.send(filteredMessages);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});