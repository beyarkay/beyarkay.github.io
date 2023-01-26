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
    return (
        <Autocomplete
            isOptionEqualToValue={(option: AreaMetadata, value: AreaMetadata) => option.calendar_name === value.calendar_name }
            id="autocomplete-areas"
            groupBy={(option) => option.province !== undefined ? prettifyName(option.province) : "Eskom Direct"}
            loading={["unsent", "loading"].includes(result.state)}
            blurOnSelect={true}
            options={result.state === "ready" ? result.content : []}
            noOptionsText={"No areas"}
            value={value}
            disabledItemsFocusable={true}
            sx={{
                boxShadow: hideCalendar ? "0px 2px 10px 10px #f5eaba0f" : undefined,
                px: hideCalendar ? "16px" : undefined,
                pb: hideCalendar ? "16px" : undefined,
                pt: hideCalendar ? "0" : "8px",
                mt: hideCalendar ? "25px" : undefined,
                borderRadius: "10px",
            }}
            renderOption={(props, option, state) => <AreaAutoCompleteOption state={state} props={props} option={option}/>}
            getOptionLabel={option => `${prettifyName(option.calendar_name)} (${option.calendar_name.replace(".ics", "")})`}
            onChange={onChange}
            filterOptions={ createFilterOptions({
                stringify: (area) => { return (
                    prettifyName(area.calendar_name)  + " " +  area.calendar_name + " " + area.areas.map(a => a.name).join(" ")
                )},
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
