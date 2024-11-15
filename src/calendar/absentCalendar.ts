import * as ical from 'ical'
// @ts-ignore
import {VEvent} from 'ical'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import {ColleagueTimeOff, TimeOffEvent} from '../types/types'

dayjs.extend(isBetween)

export async function fetchICalData(icalUrl: string): Promise<string> {
  try {
    const response = await fetch(icalUrl)
    if (!response.ok) {
      throw new Error(`Network error: ${response.statusText}`)
    }
    return response.text()
  } catch (error) {
    throw new Error(`Failed to fetch iCal data: ${(error as Error).message}`)
  }
}

export function parseICalData(icalData: string): TimeOffEvent[] {
  const events = ical.parseICS(icalData)
  const now = dayjs()

  return Object.values(events)
    .filter((event): event is VEvent => event.type === 'VEVENT')
    .map((event) => ({
      start: dayjs(event.start as string),
      end: dayjs(event.end as string),
      summary: event.summary as string
    }))
    .filter((event) => event.end.isAfter(now) || event.end.isSame(now))
}

export function mapColleaguesToTimeOff(
  colleagues: string[],
  timeOffEvents: TimeOffEvent[]
): ColleagueTimeOff[] {
  return colleagues.flatMap((colleague) =>
    timeOffEvents
      .filter((event) => event.summary.includes(colleague))
      .map((event) => ({
        ...event,
        name: colleague
      }))
  )
}

export function categorizeColleagues(
  colleaguesTimeOff: ColleagueTimeOff[],
  checkDate: dayjs.Dayjs
): {offline: string[]; online: string[]} {
  const offline: string[] = []

  colleaguesTimeOff.forEach((colleague) => {
    if (checkDate.isBetween(colleague.start, colleague.end, null, '[]')) {
      offline.push(colleague.name)
    }
  })

  const online = colleaguesTimeOff
    .map((colleague) => colleague.name)
    .filter((name) => !offline.includes(name))

  return {offline, online}
}

export function formatResults(
  offline: string[],
  checkDate: dayjs.Dayjs
): string {
  let result = `People who are offline (${checkDate.format(
    'dddd, MMMM D, YYYY'
  )}):\n`
  result += offline.length > 0 ? offline.join(', ') : 'None are offline'
  return result
}

export async function checkFriendsTimeOff(
  colleagues: string[],
  icalUrl: string,
  date: string | null
): Promise<string> {
  try {
    const icalData = await fetchICalData(icalUrl)
    const timeOffEvents = parseICalData(icalData)
    const colleaguesTimeOff = mapColleaguesToTimeOff(colleagues, timeOffEvents)
    const checkDate = date ? dayjs(date) : dayjs()

    if (colleaguesTimeOff.length === 0) {
      return `No time off data found for the specified colleagues.`
    }

    const {offline} = categorizeColleagues(colleaguesTimeOff, checkDate)
    return formatResults(offline, checkDate)
  } catch (error: any) {
    return `Error checking colleagues time off: ${error?.message}`
  }
}
