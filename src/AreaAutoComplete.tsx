import * as React from "react"
import {Autocomplete, CircularProgress, TextField, Typography} from "@mui/material"
import {AreaMetadata, prettifyName, Result} from "./EskomCalendar"
import { createFilterOptions } from "@mui/material/Autocomplete"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"
import AreaAutoCompleteOption from "./AreaAutoCompleteOption"


type AreaAutoCompleteProps = {
    result: Result<AreaMetadata[], string>;
    value: AreaMetadata | null;
    onChange: (event: React.SyntheticEvent<Element, Event>, value: AreaMetadata | null) => void;
    hideCalendar: boolean;
}

function AreaAutoComplete({result, value, onChange, hideCalendar}: AreaAutoCompleteProps) {
    const noOptionsComponent = (
        <a
            href="https://github.com/beyarkay/eskom-calendar/issues/new?assignees=beyarkay&labels=missing-area-schedule%2C+waiting-on-maintainer&template=missing-loadshedding-area-suburb.md&title=Missing+area+schedule"
            style={{textDecoration: "none"}}
            target={"_blank"}
            rel="noreferrer"
        >
            <Typography align="center" variant="h6" fontFamily={"Martel"} color={"text.primary"}>
                Can&apos;t find your area? Click here.
            </Typography>
        </a>
    )
    return (
        <Autocomplete
            autoComplete
            autoHighlight
            autoSelect
            blurOnSelect={true}
            getOptionLabel={option => `${prettifyName(option.calendar_name)} (${option.calendar_name.replace(".ics", "")})`}
            id="autocomplete-areas"
            isOptionEqualToValue={(option: AreaMetadata, value: AreaMetadata) => option.calendar_name === value.calendar_name }
            loading={["unsent", "loading"].includes(result.state)}
            noOptionsText={noOptionsComponent}
            onChange={onChange}
            options={result.state === "ready" ? result.content : []}
            renderOption={(props, option, state) => state.inputValue.length > 2 ? <AreaAutoCompleteOption state={state} props={props} option={option}/> : undefined}
            value={value}
            sx={{
                boxShadow: hideCalendar ? "0px 2px 10px 10px #f5eaba0f" : undefined,
                px: hideCalendar ? "16px" : undefined,
                pb: hideCalendar ? "16px" : undefined,
                pt: hideCalendar ? "0" : "8px",
                mt: hideCalendar ? "25px" : undefined,
                borderRadius: "10px",
            }}
            filterOptions={ createFilterOptions({
                stringify: (area) => (
                    prettifyName(area.calendar_name)  + " " +  area.calendar_name + " " + area.areas.map(a => a.name).join(" ")
                ).replaceAll("-", " "),
                trim: true,
            })}
            renderInput={(params) => {
                return (
                    <TextField
                        {...params}
                        variant="standard"
                        label={(["unsent", "loading"].includes(result.state)
                            ? "Getting the loadshedding schedules..."
                            : (result.state === "error"
                                ? <Typography align="center">Failed to get the loadshedding schedules</Typography>
                                : <Typography align="center">Find load shedding area</Typography>
                            )
                        )}
                        size="medium"
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (<>
                                {(["unsent", "loading"].includes(result.state)
                                    ? <CircularProgress color="inherit" size={20} />
                                    : (result.state === "error"
                                        ? <ErrorOutlineIcon color="inherit"/>
                                        : undefined
                                    )
                                )}
                                {params.InputProps.endAdornment}
                            </>),
                        }}
                    />
                )
            }}
        />
    )
}

export default AreaAutoComplete
