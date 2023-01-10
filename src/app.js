import express, { json } from 'express';
import cors from 'cors';
import { messageSchema, participantSchema } from './utils/validation.js';
import dayjs from 'dayjs';

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

  const time = `${dayjs().hour()}:${dayjs().minute()}:${dayjs().second()}`;

  //TODO: Cadastrar no banco de dados
  messages.push({ ...sentMessage, from: user, time });

  res.sendStatus(201);

});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});