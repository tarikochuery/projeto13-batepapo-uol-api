import dayjs from "dayjs";

export const getNowTime = () => {
  const hour = (dayjs().hour()).toLocaleString('pt-br', { minimumIntegerDigits: 2 });
  const minute = (dayjs().minute()).toLocaleString('pt-br', { minimumIntegerDigits: 2 });
  const second = (dayjs().second()).toLocaleString('pt-br', { minimumIntegerDigits: 2 });
  return `${hour}:${minute}:${second}`;
};