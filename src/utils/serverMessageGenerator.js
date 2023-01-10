import { getNowTime } from "./getNowTime.js";

export const generateLeaveServerMessage = (from) => {
  const leaveServerMessage = {
    from,
    text: 'sai da sala...',
    to: 'todos',
    time: getNowTime(),
    type: 'status'
  };

  return leaveServerMessage;
};

export const generateEntryServerMessage = (from) => {
  const entryServerMessage = {
    from,
    text: 'entra na sala...',
    to: 'todos',
    time: getNowTime(),
    type: 'status'
  };

  return entryServerMessage;
};