import * as React from "react"
import AssetAutoComplete from "./AssetAutoComplete"
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
                    const matched = newAssets.content.filter(asset => asset.name === calendar)
                    if (matched.length > 0) {
                        setSelectedAsset(matched[0])
                    }
                }
                setAssets(newAssets)
            })
            .catch(err => setAssets({state: "error", content: err}))
    }

    React.useEffect(checkRateLimit, [])

    const share_text = selectedAsset === null
        ? `Check out loadshedding schedules for for free online with eskom-calendar: ${window.location}`
        : `Check out the loadshedding schedule for ${prettifyName(selectedAsset.name)} for free online with eskom-calendar: ${window.location}`

    return (<>
        <Box sx={{background: "#26251F"}}>
            <Container maxWidth="md">
                <Stack direction="row" alignItems="center" justifyContent="space-around">
                    <Typography align="center" fontSize={40} fontFamily={"Martel"} color={"text.primary"}>
                        {" "}
                    </Typography>
                    <Typography align="center" fontSize={40} fontFamily={"Martel"} color={"text.primary"}>
                        🔌 eskom-calendar
                    </Typography>
                    <a href="https://github.com/beyarkay/eskom-calendar/#readme" target={"_blank"} rel="noreferrer">
                        <img src="github-mark-white.svg" alt="GitHub link" width="30" height="30"/>
                    </a>
                </Stack>
                <Container maxWidth="md">
                    <Typography align="center" fontSize={20} fontFamily={"Overpass"} color={"text.secondary"}>
                        Advert-free loadshedding schedules, online or in your digital calendar
                    </Typography>
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
                    {/*TODO update the conditions for this item*/}
                    {
                        events.state === "ready" && events.content.filter(event => event.area_name === selectedAsset?.name.replace(".ics", "")).length === 0
                            ? <Typography fontFamily={"Overpass"} color={"text.primary"}>
                                (There&apos;s no loadshedding scheduled for {selectedAsset !== null ? prettifyName(selectedAsset.name) : (searchParams.get("calendar") || "the selected area")})
                            </Typography>
                            : undefined
                    }
                </Container>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, iCalendarPlugin]}
                    initialView={"timeGrid"} // days along the x-axis, time along the y-axis
                    height={500}
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
                        .filter(event => event.area_name === selectedAsset?.name.replace(".ics", ""))
                        .map(event => {
                            return {
                                title: `🔌 Stage ${event.stage} (${prettifyName(event.area_name)})`,
                                start: event.start,
                                end: event.finsh,
                                allDay: false,
                            }}) : []}
                />
                <Stack direction="row" alignItems="center" justifyContent="space-evenly" sx={{ marginTop: 2, background: "#ECC11F"}}>
                    <Box width={"25%"}>
                        <Typography align="center" fontSize={50}>⏰</Typography>
                        <Typography align="center" color={"background.default"}>Up-to-date</Typography>
                    </Box>
                    <Box width={"25%"}>
                        <Typography align="center" fontSize={50}>🙅</Typography>
                        <Typography align="center" color={"background.default"}>Advert-free</Typography>
                    </Box>
                    <Box width={"25%"}>
                        <a
                            href="https://github.com/beyarkay/eskom-calendar/#using-the-data-in-your-own-projects"
                            target={"_blank"}
                            rel="noreferrer"
                            style={{ textDecoration:"none" }}
                        >
                            <Typography align="center" fontSize={50}>👩‍💻</Typography>
                            <Typography align="center" color={"background.default"}>Developer Friendly</Typography>
                        </a>
                    </Box>
                </Stack>
                <Typography align="center" fontSize={20} fontFamily={"Overpass"} color={"text.secondary"} sx={{py: 1}}>
                    Share {selectedAsset === null ? "the URL for this site" : "the link for " + prettifyName(selectedAsset?.name)}
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
                { selectedAsset === null
                    ? <Typography align="center" fontSize={20} fontFamily={"Overpass"} color={"text.secondary"} sx={{py: 1}}>
                        As the name suggests, eskom-calendar provides a
                        calendar subscription link. Select an area above
                        and a button to copy the link will appear here.
                    </Typography>
                    : <>
                        <Typography align="center" fontSize={20} fontFamily={"Overpass"} color={"text.secondary"} sx={{py: 1}}>
                            Subscribe to the  calendar feed {selectedAsset === null ? "" : "for " +  prettifyName(selectedAsset.name)} to
                            get loadshedding in your digital calendar:
                        </Typography>
                        <CopyToClipboard>
                            {({copy}) => (
                                <Stack alignItems="center" justifyContent="space-evenly">
                                    <Button
                                        variant="contained"
                                        sx={{color: "#26251F", background: "#F5EABA", marginBottom: 10}}
                                        onClick={() => { copy(selectedAsset.browser_download_url) }}
                                    > <ContentCopyIcon/> {" Copy calendar feed"} </Button>
                                </Stack>
                            )}
                        </CopyToClipboard>
                    </>
                }
                {/* TODO: add in notifications and API explanaitons*/}
                {/* eslint-disable-next-line no-constant-condition */}
                {true ? undefined : <>
                    <Accordion sx={{background: "#ECC11F", color: "#26251F"}}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} >
                            <Typography>Allow notifications to get an alert before loadshedding hits</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
                            malesuada lacus ex, sit amet blandit leo lobortis eget.
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                    <Accordion sx={{background: "#ECC11F", color: "#26251F"}}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} >
                            <Typography>Use the API for free in your own apps or projects</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
                            malesuada lacus ex, sit amet blandit leo lobortis eget.
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                </>}
            </Container>
        </Box>
    </>)
}

export default EskomCalendar

