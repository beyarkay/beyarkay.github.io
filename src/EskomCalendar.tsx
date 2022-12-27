import * as React from "react"
import AssetAutoComplete from "./AssetAutoComplete"
import FullCalendar from "@fullcalendar/react"
import Header from "./Header"
import dayGridPlugin from "@fullcalendar/daygrid"
import iCalendarPlugin from "@fullcalendar/icalendar"
import timeGridPlugin from "@fullcalendar/timegrid"
import { Octokit } from "@octokit/core"
import {Container, Typography} from "@mui/material"

const DEBUG = false

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
        React.useState<ReleaseAsset | undefined>(undefined)
    const [assets, setAssets] =
        React.useState<Result<ReleaseAsset[], string>>( { state: "unsent" })

    if (events.state === "unsent") {
        downloadMachineFriendly().then(newEvents => {
            console.table(newEvents)
            setEvents({
                state: "ready",
                content: newEvents,
            })
        }).catch(err => setEvents({state: "error", content: err}))
    }

    if (assets.state === "unsent") {
        getReleaseAssets()
            .then(newAssets => { setAssets(newAssets) })
            .catch(err => setAssets({state: "error", content: err}))
    } 

    React.useEffect(checkRateLimit, [])

    return (<>
        <Header/>
        <Container maxWidth="lg">
            <Typography > 1. Find your location: </Typography>
            <AssetAutoComplete 
                result={assets} 
                onChange={(_event, value) => {
                    console.log(_event, value)
                    setSelectedAsset(value ?? undefined)
                    if (events.state === "ready") {
                        console.log(events.content
                            .filter(event => event.area_name === value?.name.replace(".ics", ""))
                        )
                    } else {
                        console.log(events)
                    }
                }}
            />
            <Typography > 2. Enjoy your calendar: </Typography>
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, iCalendarPlugin]}
                initialView="timeGridWeek"
                editable={true}
                events={events.state == "ready" ? events.content
                    .filter(event => event.area_name === selectedAsset?.name.replace(".ics", ""))
                    .map(event => ({
                        title: `Stage ${event.stage} (${event.area_name})`,
                        start: event.start,
                        finsh: event.finsh,
                    })) : []}
            />
        </Container>
    </>)
}

export default EskomCalendar

