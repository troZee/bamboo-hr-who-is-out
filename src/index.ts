import {checkFriendsTimeOff} from './calendar/absentCalendar'

async function findWhoIsOut(
  colleagues: string[],
  calendarURL: string,
  date: string | null
): Promise<string> {
  return await checkFriendsTimeOff(colleagues, calendarURL, date)
}

(async (): Promise<void> => {
  const result = await findWhoIsOut(
    ['John', 'Clare', 'Peter'],
    'webcal://www.meetup.com/Keiretsu-Forum-East-Bay/events/ical/',
    '1519211809934'
  )

  console.log(result)
})();
