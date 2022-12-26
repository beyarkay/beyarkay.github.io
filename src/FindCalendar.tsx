import * as React from "react"
import ErrorIcon from "@mui/icons-material/Error"
import Autocomplete from "@mui/material/Autocomplete"
import Button from "@mui/material/Button"
import CopyToClipboard from "./CopyToClipboard"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import iCalendarPlugin from "@fullcalendar/icalendar"
import timeGridPlugin from "@fullcalendar/timegrid"
import match from "autosuggest-highlight/match"
import parse from "autosuggest-highlight/parse"
import {Octokit} from "@octokit/core"
import {RequestParameters} from "@octokit/core/dist-types/types"
import {Container} from "@mui/material"

export type Schedule = {
    area_name: string;
    start: string;
    finsh: string;
    stage: number;
    source: string;
};

export type Event = {
    title: string;
    start: string;
    end: string;
};

export type Item = {
    label: string;
    calId: string;
    calName: string;
    url: string;
    dl_url: string;
}

function FindCalendar() {
    const [error, setError] = React.useState(null)
    const [isLoaded, setIsLoaded] = React.useState(false)
    const [items, setItems] = React.useState<Item[]>([])
    const [selectedAreaName, setSelectedAreaName] = React.useState<string | undefined>(undefined)
    const [events, setEvents] = React.useState<Event[]>([])
    const [schedules, setSchedules] = React.useState<Schedule[]>([])

    // Load in the ICS data
    React.useEffect(() => {
        fetch("http://129.151.83.171/machine_friendly.csv")
            .then(response => {
                return response.text()
            }).then(body => {
                const lines = body.split("\n")
                const csvSchedule = lines.map(line => {
                    const vals = line.split(",")
                    return {
                        area_name: vals[0],
                        start: vals[1],
                        finsh: vals[2],
                        stage: Number(vals[3]),
                        source: vals[4],
                    }
                })
                setSchedules(csvSchedule)
            })
    }, [])

    // Get the list of calendars
    React.useEffect(() => {
        const getReleaseAssets = (contents: RequestParameters) => {
            octokit.request(
                "GET /repos/beyarkay/eskom-calendar/releases/72143886/assets", {
                    owner: "beyarkay",
                    repo: "repo",
                    release_id: "72143886",
                    ...contents
                }).then(r => {
                if (r.data.length == 0) {
                    console.log("End of pages ", items.length, " items")
                } else {
                    const newItems = r.data.map((d: any) => {
                        return {
                            label: d.name.replace(".ics", "").replace(/-/g, " "),
                            calId: d.id,
                            calName: d.name,
                            url: d.url,
                            dl_url: d.browser_download_url,
                        }
                    })

                    console.log("items: ", items)
                    console.log("newItems: ", newItems)
                    setItems([...items, ...newItems])
                    setIsLoaded(true)
                    console.log("There are ", items.length, " items")
                }
            }, (err) => {
                setIsLoaded(false)
                setError(err)
                console.log("Error downloading area names")
                console.log(err)
            })
        }
        const octokit = new Octokit({
            auth: process.env.GH_PAGES_ENV_PAT || process.env.GH_PAGES_PAT
        })
        console.log(process.env.GH_PAGES_ENV_PAT || process.env.GH_PAGES_PAT)
        octokit.request("GET /rate_limit", {}).then(r => {
            console.log(
                "API Ratelimit: [", r.data.rate.remaining, "/", r.data.rate.limit, "] reset: ", (new Date(r.data.rate.reset * 1000))
            )
        })

        // console.log(process.env.GH_PAGES_ENV_PAT)
        for (let i = 0; i < 5; i++) {
            getReleaseAssets({
                per_page: 100,
                page: i,
            })
            console.log("items: ", items)
        }
        return () => {setItems([])}
    }, [])

    // When the calendars are collected, choose a random one of them
    React.useEffect(() => {
        // Check the search params. If Area Name is provided, then use that
        // one. If it's not provided, just choose a random one
        const params = new URLSearchParams(location.search)
        const area_name = params.get("area_name")
        if (area_name !== null) {
            setSelectedAreaName(area_name)
        } else if (items.length > 0) {
            setSelectedAreaName(items[Math.floor(Math.random() * items.length)].calName.replace(".ics", ""))
        }
    }, [items])

    const selectedArea = items.find(item => item.calName === selectedAreaName)
    // When a calendar has been selected, narrow down the schedules to just the
    // one which was selected
    React.useEffect(() => {
        if (selectedArea !== undefined) {
            const events = schedules.filter(
                sched => sched.area_name === selectedAreaName
            )
            const emojis = ["💡", "☹️", "😖", "😤", "😡", "🤬", "🔪", "☠️", "⚰️"]
            setEvents(events.map(e => {
                return {
                    title: "🔌 " + prettifyTitle(e.area_name) + " Stage " + e.stage + emojis[e.stage],
                    start: e.start,
                    end: e.finsh,
                }
            }))
        }
    }, [items, schedules])

    // If the selected area gets updated, also update the search params
    React.useEffect(() => {
        const params = new URLSearchParams(location.search)
        if (selectedAreaName !== undefined) {
            params.set("area_name", selectedAreaName.replace(".ics", ""))
        } else {
            params.delete("area_name")
        }
        window.history.replaceState(
            {}, "", `${location.pathname}?${params.toString()}`
        )
    }, [selectedAreaName])
    return (<>
        <Container maxWidth="lg">
            <Typography >
                1. Find your location
            </Typography>
            <div>{selectedAreaName}</div>
            {/* Yes this ternary is disgusting, but it'll get cleared up in a bit*/}
            {(!error && isLoaded) ? <Autocomplete
                onChange={(_event, new_value) => {
                    setSelectedAreaName(items.find(
                        item => item["label"] === new_value?.label
                    )?.calName.replace(".ics", ""))
                    console.log(new_value)
                }}
                isOptionEqualToValue={(option: Item, value: Item) => option.label === value.label}
                id="autocomplete-areas"
                blurOnSelect
                options={items || []}
                defaultValue={selectedArea}
                value={selectedArea}
                renderInput={(params) => <TextField {...params} />}
                includeInputInList
                size="small"
                autoComplete
                autoHighlight
                renderOption={(props, option, {inputValue}) => {
                    const matches = match(option.label, inputValue, {insideWords: true})
                    const parts = parse(option.label, matches)

                    return (
                        <li {...props}>
                            <div>
                                {parts.map((part, index) => (
                                    <span
                                        key={index}
                                        style={{
                                            fontWeight: part.highlight ? 700 : 400,
                                        }}
                                    >
                                        {part.text}
                                    </span>
                                ))}
                            </div>
                        </li>
                    )
                }}
            /> : (error ? <><ErrorIcon /><div>Error while loading area names</div></> : <div>Loading areas...</div>)}
            <Typography >
                2. Enjoy your calendar:
            </Typography>
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, iCalendarPlugin]}
                initialView="timeGridWeek"
                events={events}
            />
            <Typography >
                You can get loadshedding in your own calendar app (like
                Outlook, Google Calendar, or Apple Calendar) by copying the
                link below and pasting it into your app&apos;s &quot;subscribe
                to calendar&quot; option.
            </Typography>
            <CopyToClipboard>
                {({copy}) => (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            const selectedItem = items.find(item => item.calName == selectedAreaName)
                            if (selectedItem !== undefined) {
                                copy(selectedItem["dl_url"])
                            }
                        }}
                    > Copy </Button>
                )}
            </CopyToClipboard>
            <Typography >
                You can also click the button below to get notifications from
                this website 15 minutes before loadshedding is about to come to
                your area.
            </Typography>
            <Button
                variant="contained"
                color="primary"
                onClick={() => {console.log("Requested")}}
            >Notify Me</Button>
        </Container>
    </>)
}

function prettifyTitle(title: string) {
    return title
        .replaceAll("-", " ")
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


export default FindCalendar

