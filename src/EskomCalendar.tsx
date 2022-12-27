import * as React from "react"
import AssetAutoComplete from "./AssetAutoComplete"
import FullCalendar from "@fullcalendar/react"
import Header from "./Header"
import dayGridPlugin from "@fullcalendar/daygrid"
import iCalendarPlugin from "@fullcalendar/icalendar"
import timeGridPlugin from "@fullcalendar/timegrid"
import { Octokit } from "@octokit/core"
import {Button, Container, Typography} from "@mui/material"
import {useSearchParams} from "react-router-dom"
import CopyToClipboard from "./CopyToClipboard"

const DEBUG = true

export type Result<T, E>
    = { state: "unsent" }
    | { state: "loading" }
    | { state: "ready", content: T }
    | { state: "error", content: E }

export type Uploader = {
    login: string,
    id: number,
    node_id: string,
    avatar_url: string,
    gravatar_id: string,
    url: string,
    html_url: string,
    followers_url: string,
    following_url: string,
    gists_url: string,
    starred_url: string,
    subscriptions_url: string,
    organizations_url: string,
    repos_url: string,
    events_url: string,
    received_events_url: string,
    type: string,
    site_admin: boolean
};

export type ReleaseAsset = {
    url: string,
    id: number,
    node_id: string,
    name: string,
    label:  string,
    uploader: Uploader,
    content_type: string,
    state: string,
    size: number,
    download_count: number,
    created_at: string,
    updated_at: string,
    browser_download_url: string
}

export type Event = {
    area_name: string,
    start: string,
    finsh: string,
    stage: string,
    source: string,
};

export function prettifyName(name: string) {
    return name
        .replaceAll("-", " ")
        .replace(".ics", "")
        .replace(
            /\w\S*/g,
            txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        )
        .replace("City Of Cape Town", "Cape Town")
        .replace("Eastern Cape", "EC")
        .replace("Free State", "FS")
        .replace("Kwazulu Natal", "KZN")
        .replace("Limpopo", "LP")
        .replace("Mpumalanga", "MP")
        .replace("North West", "NC")
        .replace("Northern Cape", "NW")
        .replace("Western Cape", "WC")
        .replace("Gauteng Ekurhuleni Block", "Ekurhuleni")
        .replace("Gauteng Tshwane Group", "Tshwane")
}

const getReleaseAssets = async () => {
    const octokit = new Octokit({ })

    async function getPaginatedData(url: string) {
        const nextPattern = /(?<=<)([\S]*)(?=>; rel="Next")/i
        let pagesRemaining = true
        let result: Result<ReleaseAsset[], string> = {
            state: "unsent",
        }

        while (pagesRemaining) {
            const response = await octokit.request(`GET ${url}`, {
                per_page: 100,
            })
            if (response.status !== 200) {
                result = {
                    state: "error",
                    content: String(response.status),
                }
                break
            }

            result = {
                state: "ready",
                content: [
                    ...(result.state === "unsent" ? [] : result.content),
                    ...response.data
                ],
            }

            const linkHeader = response.headers.link
            if ( linkHeader && linkHeader.includes("rel=\"next\"") ) {
                const match = linkHeader.match(nextPattern)
                if( match !== null) {
                    url = match[0]
                }
            } else {
                pagesRemaining = false
            }
            if (DEBUG) { break }
        }
        return result
    }

    const content = await getPaginatedData(
        "/repos/beyarkay/eskom-calendar/releases/72143886/assets"
    )
    return content
}

const downloadMachineFriendly = async () => {
    const id = "SuK0u"
    return fetch(`https://dpaste.org/${id}/raw`)
        .then(res => res.text())
        .then(newEvents => {
            const events: Event[] = newEvents.split("\n").map( line => ( {
                area_name: line.split(",")[0],
                start:  line.split(",")[1],
                finsh:  line.split(",")[2],
                stage:  line.split(",")[3],
                source: line.split(",")[4],
            }))
            return events
        })
}

const checkRateLimit = () => {
    const octokit = new Octokit({ })
    octokit.request("GET /rate_limit", {}).then(r => {
        console.log(
            "API Ratelimit: [", r.data.rate.remaining, "/", r.data.rate.limit, "] reset: ", (new Date(r.data.rate.reset * 1000))
        )
    })
}

function EskomCalendar() {
    const [events, setEvents] =
        React.useState<Result<Event[], string>>( { state: "unsent" })
    const [selectedAsset, setSelectedAsset] =
        React.useState<ReleaseAsset | null>(null)
    const [assets, setAssets] =
        React.useState<Result<ReleaseAsset[], string>>( { state: "unsent" })
    const [searchParams, setSearchParams] = useSearchParams()
    const calendar = searchParams.get("calendar") || undefined

    if (events.state === "unsent") {
        downloadMachineFriendly().then(newEvents => {
            setEvents({
                state: "ready",
                content: newEvents,
            })
        }).catch(err => setEvents({state: "error", content: err}))
    }

    if (assets.state === "unsent") {
        getReleaseAssets()
            .then(newAssets => {
                if (newAssets.state === "ready") {
                    console.log("Assets are ready")
                    const matched = newAssets.content.filter(asset => asset.name === calendar)
                    console.log(matched.length + " assets were matched for " + calendar)
                    if (matched.length > 0) {
                        setSelectedAsset(matched[0])
                    }
                }
                setAssets(newAssets)
            })
            .catch(err => setAssets({state: "error", content: err}))
    }

    React.useEffect(checkRateLimit, [])

    return (<>
        <Header/>
        <Container maxWidth="lg">
            <Typography > 1. Find your location: </Typography>
            <AssetAutoComplete
                result={assets}
                value={selectedAsset}
                onChange={(_event, value) => {
                    setSelectedAsset(value)
                    if (value !== null) {
                        searchParams.set("calendar", value.name)
                        setSearchParams(searchParams)
                    } else {
                        searchParams.delete("calendar")
                        setSearchParams(searchParams)
                    }
                }}
            />
            <Typography > 2. Enjoy your calendar: </Typography>
            {
                events.state == "ready"  && events.content.filter(event => event.area_name === selectedAsset?.name.replace(".ics", "")).length > 0
                    ? undefined
                    : (selectedAsset === null ? undefined : <Typography >(There&apos;s no loadshedding scheduled for {prettifyName(selectedAsset?.name || "the selected area")})</Typography>)
            }
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, iCalendarPlugin]}
                initialView={"timeGridWeek"} // days along the x-axis, time along the y-axis
                height={500}
                nowIndicator={true} // Show a horizontal bar for the current time
                allDaySlot={false} // do not give any space for all-day events
                slotDuration={"01:00:00"}
                slotLabelFormat={{
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                }}
                dayHeaderFormat={{
                    weekday: "short",
                    month: "short",
                    day: "2-digit",
                }}
                eventTimeFormat={{
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                }}
                titleFormat={{
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }}
                events={events.state == "ready" ? events.content
                    .filter(event => event.area_name === selectedAsset?.name.replace(".ics", ""))
                    .map(event => {
                        return {
                            title: `🔌 Stage ${event.stage} (${event.area_name})`,
                            start: event.start,
                            end: event.finsh,
                            allDay: false,
                        }}) : []}
            />
        </Container>
    </>)
}

export default EskomCalendar

