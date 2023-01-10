import { MILISECONDS_TO_SECONDS_MULTIPLIER, STATUS_LIMIT } from "./constants.js";

export const validateParticipantLastStatus = (participant) => {
  const { lastStatus } = participant;

  const isDifferenceMoreThanLimit = Date.now() - lastStatus > STATUS_LIMIT * MILISECONDS_TO_SECONDS_MULTIPLIER;

  return isDifferenceMoreThanLimit;
};

