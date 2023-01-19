import * as React from "react"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import interactionPlugin from "@fullcalendar/interaction"
import dayGridPlugin from "@fullcalendar/daygrid"
import iCalendarPlugin from "@fullcalendar/icalendar"
import timeGridPlugin from "@fullcalendar/timegrid"
import FullCalendar from "@fullcalendar/react"
import TextField from "@mui/material/TextField"
import CopyToClipboard from "./CopyToClipboard"
import {Box, Button, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup} from "@mui/material"
import {DateSelectArg, EventClickArg} from "fullcalendar"
import jsyaml from "js-yaml"


type Change = {
    id: string;
    stage: number;
    start: string;
    finsh: string;
    source: string;
    exclude?: string;
    include?: string;
};

function MakePullRequest() {
    const [changes, setChanges] = React.useState<Change[]>([])
    const [source, setSource] = React.useState<string | undefined>(undefined)
    const [stage, setStage] = React.useState<number | undefined>(undefined)

    const addChange = (change: Change) => { setChanges([...changes, change]) }

    const removeChange = (id: string) => { setChanges(changes.filter(c => c.id !== id)) }

    const modifyChange = (id: string, callback: (old: Change) => Change) => {
        setChanges(changes.map(c => c.id === id ? callback(c) : c))
    }

    const changesToText = (changes: Change[]) => {
        const ordering: { [key: string]: number } = {
            stage: 0,
            start: 1,
            finsh: 2,
            source: 3,
            include: 4,
            exclude: 5,
        }

        return "  " + jsyaml.dump(
            changes.map(c => ({
                stage: c.stage,
                start: c.start,
                finsh: c.finsh,
                source: c.source,
                include: c.include,
                exclude: c.exclude,
            })).sort(
                (c1, c2) => c1.start < c2.start ? -1 : (c1.start === c2.start ? 0 : 1)
            ),
            {sortKeys: (a, b) => ordering[a] - ordering[b]}
        ).replaceAll("'", "").replaceAll("\n", "\n  ").replaceAll("+02:00", "")
    }

    const changeToEvent = (change: Change) => ({
        start: change.start,
        end: change.finsh,
        title: `Stage ${change.stage}\nEvent ${change.id}`,
        id: change.id,
    })

    return (<>
        <TextField
            label={"Source"}
            value={source}
            fullWidth
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setSource(event.target.value)
            }}
        />
        <Box>
            <blockquote className="twitter-tweet">
                <a href={source}></a>
            </blockquote>
        </Box>
        <FormControl>
            <FormLabel>Stage</FormLabel>
            <RadioGroup
                row
                value={stage}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setStage(Number((event.target as HTMLInputElement).value))
                }}
            >
                <FormControlLabel value={1} control={<Radio />} label="1" />
                <FormControlLabel value={2} control={<Radio />} label="2" />
                <FormControlLabel value={3} control={<Radio />} label="3" />
                <FormControlLabel value={4} control={<Radio />} label="4" />
                <FormControlLabel value={5} control={<Radio />} label="5" />
                <FormControlLabel value={6} control={<Radio />} label="6" />
                <FormControlLabel value={7} control={<Radio />} label="7" />
                <FormControlLabel value={8} control={<Radio />} label="8" />
            </RadioGroup>
        </FormControl>
        <FullCalendar
            plugins={[interactionPlugin, dayGridPlugin, timeGridPlugin, iCalendarPlugin]}
            initialView={"timeGrid"}
            editable={true}
            eventDurationEditable={true}
            eventChange={(arg) => {
                console.log("change")
                console.log(arg)
                modifyChange(arg.oldEvent.id, (old: Change) => {
                    return {
                        start: arg.event.startStr,
                        finsh: arg.event.endStr,
                        id: old.id,
                        source: old.source,
                        exclude: old.exclude,
                        include: old.include,
                        stage: old.stage,
                    }
                })
            }}
            nowIndicator={true} // Show a horizontal bar for the current time
            allDaySlot={false} // do not give any space for all-day events
            slotDuration={"01:00:00"}
            selectable
            eventClick={(arg: EventClickArg) => {
                removeChange(arg.event.id)
            }}
            select={(arg: DateSelectArg) => {
                addChange({
                    id: (new Date()).toISOString(),
                    stage: stage || 0,
                    start: arg.startStr,
                    finsh: arg.endStr,
                    source: source || "No source",
                    ...(source?.toLowerCase().includes("eskom_sa")
                        ? {exclude: "coct"}
                        : (source?.toLowerCase().includes("cityofct") ? {include: "coct"} : {})
                    )
                })
            }}
            visibleRange={(currentDate) => {
                // The start date is the current date, the end date is a
                // few days into the future
                const endDate = new Date(currentDate.valueOf())
                endDate.setDate(endDate.getDate() + 6)
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
            events={changes.map(changeToEvent)}
        />
        <CopyToClipboard>
            {({copy}) => (
                <Button
                    sx={{color: "#26251F", background: "#F5EABA"}}
                    variant="contained"
                    target="_blank"
                    rel="noreferrer"
                    href="https://github.com/beyarkay/eskom-calendar/edit/main/manually_specified.yaml"
                    onClick={() => { copy(changesToText(changes)) }}
                > <ContentCopyIcon/> {"Copy & Edit manually_specified"} </Button>
            )}
        </CopyToClipboard>
        <TextField
            multiline
            InputProps={{style: {fontFamily: "monospace"}}}
            fullWidth
            rows={12}
            value={changesToText(changes)}
            sx={{fontFamily: "monospace"}}
        />
    </>
    )
}

export default MakePullRequest
