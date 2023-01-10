import express, { json } from 'express';
import cors from 'cors';
import { participantSchema } from './utils/validation.js';

const app = express();

app.use(cors());
app.use(json());

const PORT = 5000;

const participants = [];

app.post('/participants', (req, res) => {
  const reqData = req.body;

  const { value: participantRegistered, error } = participantSchema.validate(reqData);

  if (error) return res.status(422).send(error.message);

  //TODO: Fazer busca no banco de dados
  const isParticipantRegistered = participants.find(participant => participant.name === participantRegistered.name);

  if (isParticipantRegistered) return res.sendStatus(409);

  //TODO: Fazer cadastro no banco de dados (nome da collection deve ser participants)
  participants.push({ ...participantRegistered, lastStatus: Date.now() });
  res.sendStatus(201);

});

app.get('/participants', (req, res) => {
  res.send(participants);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});