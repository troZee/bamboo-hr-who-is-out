import dayjs from 'dayjs'

export interface TimeOffEvent {
  start: dayjs.Dayjs
  end: dayjs.Dayjs
  summary: string
}

export interface ColleagueTimeOff extends TimeOffEvent {
  name: string
}
