import { SECONDS_TO_MILISECONDS_MULTIPLIER, STATUS_LIMIT } from "./constants.js";

export const validateParticipantLastStatus = (participant) => {
  const { lastStatus } = participant;

  const isDifferenceMoreThanLimit = Date.now() - lastStatus > STATUS_LIMIT * SECONDS_TO_MILISECONDS_MULTIPLIER;

  return isDifferenceMoreThanLimit;
};

