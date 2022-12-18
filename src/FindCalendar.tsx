import * as React from "react"
import Autocomplete from "@mui/material/Autocomplete"
import Button from "@mui/material/Button"
import CopyToClipboard from "./CopyToClipboard"
import FullCalendar from "@fullcalendar/react"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import dayGridPlugin from "@fullcalendar/daygrid"
import iCalendarPlugin from "@fullcalendar/icalendar"
import match from "autosuggest-highlight/match"
import parse from "autosuggest-highlight/parse"
import timeGridPlugin from "@fullcalendar/timegrid"
import { Octokit } from "@octokit/core"

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
    const [itemIdx, setItemIdx] = React.useState(0)
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
                        start:     vals[1],
                        finsh:     vals[2],
                        stage:     Number(vals[3]),
                        source:    vals[4],
                    }
                })
                setSchedules(csvSchedule)
            })
    }, [])

    // Get the list of calendars
    React.useEffect(() => {
        console.log(process.env.GH_PAGES_ENV_PAT)
        const octokit = new Octokit({
            auth: process.env.GH_PAGES_ENV_PAT || process.env.GH_PAGES_PAT
        })
        octokit.request(
            "GET /repos/beyarkay/eskom-calendar/releases/72143886/assets", {
                owner: "beyarkay",
                repo: "repo",
                release_id: "72143886"
            }).then(r => {
            setIsLoaded(true)
            const items = r.data.map((d:any) => {return {
                label: d.name.replace(".ics", "").replace(/-/g, " "),
                calId: d.id,
                calName: d.name,
                url: d.url,
                dl_url: d.browser_download_url,
            }})

            setItems(items)
        }, (err) => {
            setIsLoaded(false)
            setError(err)
            console.log("Error downloading release assets")
            console.log(err)
        })
    }, [])

    // When the calendars are collected, choose a random one of them
    React.useEffect(() => {
        setItemIdx(Math.floor(Math.random() * items.length))
    }, [items])

    // When a calendar has been selected, narrow down the schedules to just the
    // one which was selected
    React.useEffect(() => {
        if (itemIdx < items.length) {
            const area_name = items[itemIdx]["calName"].replace(".ics", "")
            const events = schedules.filter(sched => sched.area_name === area_name)
            const emojis = ["😕", "☹️", "😖", "😤", "😡", "🤬", "🔪", "☠️"]

            setEvents(events.map(e => { return {
                title: "🔌 " + prettifyTitle(e.area_name) + " Stage " + e.stage + emojis[e.stage-1],
                start: e.start,
                end: e.finsh,
            }}))
        }
    }, [items, itemIdx, schedules])

    return (<>
        <Typography >
        1. Find your location
        </Typography>
        {/* Yes this ternary is disgusting, but it'll get cleared up in a bit*/}
        { (!error && isLoaded) ? <Autocomplete
            onChange={(_event, value) => {
                setItemIdx(items.findIndex(item => item["label"] === value?.label))
            }}
            isOptionEqualToValue={(option: Item, value: Item) => option.label === value.label}
            id="autocomplete-areas"
            blurOnSelect
            options={items || []}
            defaultValue={(items || [])[itemIdx]}
            value={(items || [])[itemIdx]}
            renderInput={(params) => <TextField {...params} />}
            includeInputInList
            size="small"
            sx={{ width: 300 }}
            autoComplete
            autoHighlight
            renderOption={(props, option, { inputValue }) => {
                const matches = match(option.label, inputValue, { insideWords: true })
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
        /> : (error ? <div>Error while loading area names</div> : <div>Loading areas...</div>)}

        <Typography >
        2. Copy the subscription link: 
        </Typography>
        <CopyToClipboard>
            {({ copy }) => (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => copy(items[itemIdx]["dl_url"])}
                > Copy </Button>
            )}
        </CopyToClipboard>
        <Typography >
        3. Enjoy your calendar:
        </Typography>
        <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, iCalendarPlugin]}
            initialView="timeGridWeek"
            events={events}
        />
    </>)
}

function prettifyTitle(title: string) { 
    return title
        .replace("city-of-cape-town", "Cape Town")
        .replace("eastern-cape-", "EC")
        .replace("free-state-", "FS")
        .replace("kwazulu-natal-", "KZN")
        .replace("limpopo-", "LP")
        .replace("mpumalanga-", "MP")
        .replace("north-west-", "NC")
        .replace("northern-cape-", "NW")
        .replace("western-cape-", "WC")
        .replace("gauteng-ekurhuleni-block", "Ekurhuleni")
        .replace("gauteng-tshwane-group", "Tshwane")
        .replaceAll("-", " ")
        .replace(
            /\w\S*/g,
            txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        )
}


export default FindCalendar

