import * as React from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import iCalendarPlugin from "@fullcalendar/icalendar"
import timeGridPlugin from "@fullcalendar/timegrid"
import { Octokit } from "@octokit/core"
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    Container,
    Grid,
    Stack,
    Typography,
} from "@mui/material"
import {useSearchParams} from "react-router-dom"
import CopyToClipboard from "./CopyToClipboard"
import {Box} from "@mui/system"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import {
    EmailIcon,
    LinkedinIcon,
    TwitterIcon,
    WhatsappIcon,
} from "react-share"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import jsyaml from "js-yaml"
import AreaAutoComplete from "./AreaAutoComplete"

// "_self" is only set if React is in development mode
// https://stackoverflow.com/a/52857179/14555505
const DEBUG = "_self" in React.createElement("div")

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

export type Area = {
    name: string | string[],
    lat_lngs?: number[][]
    province?: string,
    municipality?: string,
}

export type AreaMetadata = {
    calendar_name: string,
    province?: string,
    municipality?: string,
    city?: string,
    provider: string,
    source: string,
    source_info: string,
    areas: Area[],
};


export type Event = {
    area_name: string,
    start: string,
    finsh: string,
    stage: string,
    source: string,
};

export function shortenProvince(province: string | undefined) {
    return province?.replace("-", " ")
        .toLowerCase()
        .replace("eastern cape", "EC")
        .replace("free state", "FS")
        .replace("kwazulu natal", "KZN")
        .replace("limpopo", "LP")
        .replace("mpumalanga", "MP")
        .replace("north west", "NC")
        .replace("northern cape", "NW")
        .replace("western cape", "WC")
}

export function prettifyName(name: string | undefined) {
    return name?.replaceAll("-", " ")
        .replace(".ics", "")
        .replace(
            /\w\S*/g,
            txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        )
        .replace("City Of Cape Town", "Cape Town")
        .replace("Gauteng Ekurhuleni Block", "Ekurhuleni")
        .replace("Gauteng Tshwane Group", "Tshwane")
}

const getReleaseAssets = async () => {
    const octokit = new Octokit({
        auth: process.env.GH_PAGES_ENV_PAT || process.env.GH_PAGES_PAT
    })

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

const downloadAreaMetadata = async() => {
    const url = "https://raw.githubusercontent.com/beyarkay/eskom-calendar/main/area_metadata.yaml"
    return fetch(url)
        .then(res => res.text())
        .then(yaml => {
            return  (jsyaml.load(yaml) as {area_details: AreaMetadata[]})["area_details"]
                .sort((a, b) => {
                    if (a.province !== undefined && b.province !== undefined) {
                        return a.province.localeCompare(b.province)
                    } else {
                        return a.calendar_name.localeCompare(b.calendar_name)
                    }
                })
        })
}

const downloadMachineFriendly = async () => {
    const octokit = new Octokit({
        auth: process.env.GH_PAGES_ENV_PAT || process.env.GH_PAGES_PAT
    })
    const desc = await octokit.request("GET /repos/beyarkay/eskom-calendar/releases/72143886", {
        owner: "beyarkay",
        repo: "eskom-calendar",
        release_id: "72143886"
    }).then((res) => res.data.body)
    const pastebin_re = /\[pastebin link\]\((https:\/\/dpaste\.org\/(\w+)\/raw)\)/gm
    const match = desc.match(pastebin_re)
    const url = match[0].replace("[pastebin link](", "").replace(")", "")
    console.log(`Fetching data from ${url}`)
    return fetch(url)
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

function pluraliser(singular: string, plural: string, incl_num: boolean) {
    return (n: number) => (incl_num ? n : "") + " " + (n == 1 ? singular : plural)
}

function formatDateDifference(date1: Date, date2: Date): string {
    const day_s = pluraliser("day", "days", true)
    const hour_s = pluraliser("hour", "hours", true)
    const minute_s = pluraliser("minute", "minutes", true)
    const diffInMs = Math.abs(date1.getTime() - date2.getTime())
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const diffInHours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const diffInMinutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60))

    const formattedDiff = (diffInDays > 0 ? day_s(diffInDays) + " " : "") +
                            (diffInHours > 0 ? hour_s(diffInHours) + " "  : "") +
                            (diffInMinutes > 0 ? minute_s(diffInMinutes) + " "  : "")

    return formattedDiff ? formattedDiff.slice(0, -1) : "0 minutes"
}

function EskomCalendar() {
    const [areaMetadata, setAreaMetadata] =
        React.useState<Result<AreaMetadata[], string>>( { state: "unsent" })
    const [selectedArea, setSelectedArea] =
        React.useState<AreaMetadata | null>(null)
    const [events, setEvents] =
        React.useState<Result<Event[], string>>( { state: "unsent" })
    const [assets, setAssets] =
        React.useState<Result<ReleaseAsset[], string>>( { state: "unsent" })
    const [searchParams, setSearchParams] = useSearchParams()

    const hideCalendar = selectedArea === null && !searchParams.has("calendar")

    if (events.state === "unsent") {
        if (localStorage.getItem("events") !== null){
            const events = JSON.parse(localStorage.getItem("events") || "undefined")
            console.log("Retrieved events from localStorage")
            setEvents({ state: "ready", content: events })
        }
        downloadMachineFriendly().then(newEvents => {
            setEvents({
                state: "ready",
                content: newEvents,
            })
            console.log("Stored events in localStorage")
            localStorage.setItem("events", JSON.stringify(newEvents))
        }).catch(err => setEvents({state: "error", content: err}))
    }

    if (assets.state === "unsent") {
        if (localStorage.getItem("assets") !== null){
            const assets = JSON.parse(localStorage.getItem("assets") || "undefined")
            console.log("Retrieved assets from localStorage")
            setAssets({ state: "ready", content: assets })
        }
        getReleaseAssets()
            .then(newAssets => {
                setAssets(newAssets)
                console.log("Stored assets in localStorage")
                localStorage.setItem("assets", JSON.stringify(newAssets))
            })
            .catch(err => setAssets({state: "error", content: err}))
    }

    if (areaMetadata.state === "unsent") {
        if (localStorage.getItem("areaMetadata") !== null){
            const areaMetadata: AreaMetadata[] = JSON.parse(localStorage.getItem("areaMetadata") || "[]")
            console.log("Retrieved areaMetadata from localStorage")
            setAreaMetadata({ state: "ready", content: areaMetadata })
            if (searchParams.has("calendar")) {
                const selected_area = areaMetadata.find(area => area.calendar_name === searchParams.get("calendar")) || null
                document.title = `eskom-calendar: ${prettifyName(selected_area?.calendar_name) ?? "Loadshedding schedules online"}`
                setSelectedArea(selected_area)
            }
        }
        downloadAreaMetadata().then(newAreaMetadata => {
            if (searchParams.has("calendar")) {
                const selected_area = newAreaMetadata.find(area => area.calendar_name === searchParams.get("calendar")) || null
                document.title = `eskom-calendar: ${prettifyName(selected_area?.calendar_name) ?? "Loadshedding schedules online"}`
                setSelectedArea(selected_area)
            }
            setAreaMetadata({ state: "ready", content: newAreaMetadata })
            console.log("Stored areaMetadata in localStorage")
            localStorage.setItem("areaMetadata", JSON.stringify(newAreaMetadata))
        }).catch(err => {
            console.log(err)
            setAreaMetadata({state: "error", content: err})
        })
    }

    React.useEffect(checkRateLimit, [])

    const share_text = selectedArea === null
        ? `Check out loadshedding schedules for for free online with eskom-calendar: ${window.location}`
        : `Check out the loadshedding schedule for ${prettifyName(selectedArea.calendar_name)} for free online with eskom-calendar: ${window.location}`

    const headerStack = (
        <Stack alignItems="center" justifyContent="space-around" spacing={0} maxWidth="395px">
            <a href="/ec" style={{textDecoration: "none"}}>
                <Stack
                    direction={hideCalendar ? "column" : "row"}
                    alignItems="center"
                    justifyContent="space-around"
                    spacing={0}
                >
                    <Typography align="center" variant={hideCalendar ? "h1" : "h4"} fontFamily={"Martel"} color={"text.primary"}>
                        🔌
                    </Typography>
                    <Typography align="center" variant={hideCalendar ? "h3" : "h4"} fontFamily={"Martel"} color={"text.primary"}>
                        eskom-calendar
                    </Typography>
                </Stack>
            </a>
            { hideCalendar
                ? <Typography align="center" variant={hideCalendar ? "h5" : "h6"} fontFamily={"Overpass"} color={"text.secondary"}>
                    Advert-free loadshedding schedules, online or in your digital calendar
                </Typography>
                : undefined
            }
        </Stack>
    )

    const headerBar = (
        <Stack
            direction={"row"}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
            p="5px"
            pr={"10px"}
            sx={{background: "#FFFFFF0A"}}
        >
            <Box></Box>
            {hideCalendar ? <Box></Box> : headerStack}
            <Box justifyContent="flex-end" display={"flex"}>
                <a href="https://github.com/beyarkay/eskom-calendar/#readme" target={"_blank"} rel="noreferrer">
                    <img src="github-mark-white.svg" alt="GitHub link" width="30" height="30"/>
                </a>
            </Box>
        </Stack>
    )
    const detailsContent = (<>
        <Typography
            pt={"10px"}
            align="center"
            fontSize={20}
            fontFamily={"Overpass"}
            color={"text.secondary"}
        >
            Eskom-calendar is all about getting up-to-date loadshedding
            schedules to South Africans. It&apos;s completely free, and has no
            adverts anywhere (because who wants to scroll past a million
            adverts when you&apos;re power has just gone off?).
            <br></br><br></br>
            Simply type in your suburb above, and we&apos;ll take care of the rest.
        </Typography>
    </>)

    const autocompleteStack = (
        <Container maxWidth="md">
            <AreaAutoComplete
                result={areaMetadata}
                value={selectedArea}
                hideCalendar={hideCalendar}
                onChange={(_event, value) => {
                    const area_name = prettifyName(value?.calendar_name)
                    document.title = `eskom-calendar: ${area_name ?? "Loadshedding schedules online"}`
                    setSelectedArea(value)
                    if (value !== null) {
                        searchParams.set("calendar", value.calendar_name)
                        setSearchParams(searchParams)
                    } else {
                        searchParams.delete("calendar")
                        setSearchParams(searchParams)
                    }
                }}
            />
            { events.state !== "ready" || !searchParams.has("calendar")
                ? undefined
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                : ( searchParams.has("calendar") && events.content.map(e => e.area_name).includes(searchParams.get("calendar")!.replace(".ics", ""))
                    ? ( events.content.filter(e => e.area_name === selectedArea?.calendar_name.replace(".ics", "")).length === 0
                        ? `No loadshedding for ${selectedArea !== null ? prettifyName(selectedArea?.calendar_name) : "the selected area"}.`
                        : undefined
                    )
                    : `Could not find the loadshedding area named '${searchParams.get("calendar")}'`
                )
            }
        </Container>
    )

    const nextLoadshedding = () => {
        if (events.state === "ready") {
            const now = new Date()
            const content = events
                .content
                .filter(event => event.area_name === selectedArea?.calendar_name.replace(".ics", ""))
                .sort((a, b) => a.start < b.start ? -1 : (a.start > b.start ? 1 : 0))
                .filter(event => (new Date(event.finsh)) > now)
                .at(0)
            if (typeof content === "undefined") {
                return (<>
                    <Typography align="center" fontSize={20} fontFamily={"Overpass"} color={"text.secondary"} sx={{pt: 2}}>
                        No loadshedding in your future 🎉
                    </Typography>
                </>)
            }
            const timeUntilStart = (new Date(content.start)).getTime() - now.getTime()
            if (timeUntilStart < 0) {
                return (<>
                    <Typography align="center" fontSize={20} fontFamily={"Overpass"} color={"text.secondary"} sx={{pt: 2}}>
                        Loadshedding will continue for {formatDateDifference(new Date(content.start), now)}.
                    </Typography>
                </>)
            } else {
                return (<>
                    <Typography align="center" fontSize={20} fontFamily={"Overpass"} color={"text.secondary"} sx={{pt: 2}}>
                        Loadshedding will start in {formatDateDifference(new Date(content.start), now)}.
                    </Typography>
                </>)
            }
        }
    }

    const calendarComponent = (
        <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, iCalendarPlugin]}
            eventTextColor="#000"
            initialView={"timeGrid"} // days along the x-axis, time along the y-axis
            height={"auto"}
            nowIndicator={true} // Show a horizontal bar for the current time
            allDaySlot={false} // do not give any space for all-day events
            slotDuration={"01:00:00"}
            visibleRange={(currentDate) => {
                // The start date is the current date, the end date is a
                // few days into the future
                const endDate = new Date(currentDate.valueOf())
                endDate.setDate(endDate.getDate() + 3)
                return { start: new Date(currentDate.valueOf()), end: endDate }
            }}
            headerToolbar={{ start: "", center: "", end: "" }} // Remove the header toolbar
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
                .filter(event => event.area_name === selectedArea?.calendar_name.replace(".ics", ""))
                .map(event => {
                    return {
                        title: `🔌 Stage ${event.stage} (${prettifyName(event.area_name)})`,
                        start: event.start,
                        end: event.finsh,
                        allDay: false,
                    }}) : []}
        />
    )

    const iconStack = (
        <Stack direction="row" alignItems="center" justifyContent="space-evenly"  sx={{ marginTop: 2, background: "#ECC11F"}}>
            <Box width={"25%"} m="10px">
                <Typography align="center" variant="h4">⏰</Typography>
                <Typography align="center" variant="h6" color={"background.default"}>Up-to-date</Typography>
            </Box>
            <Box width={"25%"} m="10px">
                <Typography align="center" variant="h4">🙅</Typography>
                <Typography align="center" variant="h6" color={"background.default"}>Advert-free</Typography>
            </Box>
            <Box width={"25%"} m="10px">
                <a
                    href="https://github.com/beyarkay/eskom-calendar/#using-the-data-in-your-own-projects"
                    target={"_blank"}
                    rel="noreferrer"
                    style={{ textDecoration:"none" }}
                >
                    <Typography align="center" variant="h4">👩‍💻</Typography>
                    <Typography align="center" variant="h6" color={"background.default"}>Developer Friendly</Typography>
                </a>
            </Box>
        </Stack>
    )

    const shareVia = ( <>
        <Typography align="center" fontSize={20} fontFamily={"Overpass"} color={"text.secondary"} sx={{py: 1}}>
            Share {selectedArea === null ? "the URL for this site" : "the link for " + prettifyName(selectedArea.calendar_name)}
            {" "}with your friends so they know when you&apos;ve got
            loadshedding:
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-evenly" sx={{py: 1}}>
            <a
                aria-label="Share via WhatsApp"
                href={`whatsapp://send?text=${share_text}`}
                data-action="share/whatsapp/share"
            >
                <WhatsappIcon size={48} borderRadius={10} round={false} />
            </a>
            <a
                aria-label="Share via Twitter"
                href={`https://twitter.com/intent/tweet?text=${share_text}&via=beyarkay`}
                data-dnt="true"
            >
                <TwitterIcon size={48} borderRadius={10} round={false}/>
            </a>
            <a
                aria-label="Share via Linkedin"
                href={"https://www.linkedin.com/sharing/share-offsite/?url=https://beyarkay.github.io"}
                title="Share by Linkedin"
            >
                <LinkedinIcon size={48} borderRadius={10} round={false} />
            </a>
            <a
                aria-label="Share via Email"
                href={`mailto:?subject=Advert-free loadshedding schedule online&body=${share_text}`}
                title="Share by Email"
            >
                <EmailIcon size={48} borderRadius={10} round={false} />
            </a>
            <CopyToClipboard>
                {({copy}) => (
                    <Button
                        sx={{color: "#26251F", background: "#F5EABA"}}
                        variant="contained"
                        onClick={() => { copy(window.location) }}
                    > <ContentCopyIcon/> {" Copy URL"} </Button>
                )}
            </CopyToClipboard>
        </Stack>
    </>)

    const copySubscriptionLink = (selectedArea === null
        ? <Typography align="center" fontSize={20} fontFamily={"Overpass"} color={"text.secondary"} sx={{py: 1}}>
            As the name suggests, eskom-calendar provides a
            calendar subscription link. Select an area above
            and a button to copy the link will appear here.
        </Typography>
        : <>
            <Typography align="center" fontSize={20} fontFamily={"Overpass"} color={"text.secondary"} sx={{py: 1}}>
                Subscribe to the  calendar feed {selectedArea === null ? "" : "for " +  prettifyName(selectedArea.calendar_name)} to
                get loadshedding in your digital calendar:
            </Typography>
            <CopyToClipboard>
                {({copy}) => (
                    <Stack alignItems="center" justifyContent="space-evenly">
                        <Button
                            variant="contained"
                            sx={{color: "#26251F", background: "#F5EABA", marginBottom: 1}}
                            onClick={() => { copy(assets.state === "ready" ? assets.content.find(a => a.name === selectedArea.calendar_name)?.browser_download_url : "") }}
                        > <ContentCopyIcon/> {" Copy calendar feed"} </Button>
                    </Stack>
                )}
            </CopyToClipboard>
        </>)

    const subscriptionHelp = (
        <Accordion sx={{background: "#ECC11F", color: "#26251F"}}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} >
                <Typography>How do I add the calendar feed to Google Calendar/Outlook/Apple Calendar/etc?</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Typography>
                    First make sure you&apos;ve copied the subscription
                    link for your calendar (using the &quot;Copy Calendar
                    Feed&quot; button above).
                </Typography>
                <Typography>
                    Now you need to open your calendar app:
                </Typography>
                <Typography>
                    Click <a
                        target="_blank"
                        rel="noreferrer"
                        href="https://calendar.google.com/calendar/u/0/r/settings/addbyurl"
                    >here</a> if you use Google calendar
                </Typography>
                <Typography>
                    Click <a
                        target="_blank"
                        rel="noreferrer"
                        href="https://outlook.office.com/calendar/addcalendar"
                    >here</a> if you use Outlook
                </Typography>
                <Typography>
                    Paste the calendar feed link into the text box that
                    pops up when you click that link, and that&apos;s
                    it!
                </Typography>
            </AccordionDetails>
        </Accordion>
    )

    return (<>
        <Box sx={{background: "#26251F"}}>
            {headerBar}
            <Grid
                spacing={0}
                alignItems="center"
                justifyContent="center"
                sx={{
                    minWidth: "100%",
                    minHeight: hideCalendar ? "50vh" : "0",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                }}
            >
                {hideCalendar ? headerStack : undefined}
                {autocompleteStack}
            </Grid>
            <Container maxWidth="md">
                {hideCalendar
                    ? <>{detailsContent}</>
                    : <>
                        {nextLoadshedding()}
                        {calendarComponent}
                        {iconStack}
                        {shareVia}
                        {copySubscriptionLink}
                        {subscriptionHelp}
                    </>
                }
                {/* TODO: add in notifications*/}
            </Container>
        </Box>
    </>)
}

export default EskomCalendar

