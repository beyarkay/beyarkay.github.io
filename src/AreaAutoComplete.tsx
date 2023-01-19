import * as React from "react"
import {Autocomplete, CircularProgress, TextField} from "@mui/material"
import {Area, AreaMetadata, prettifyName, Result} from "./EskomCalendar"
import { createFilterOptions } from "@mui/material/Autocomplete"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"
import AreaAutoCompleteOption from "./AreaAutoCompleteOption"


type AreaAutoCompleteProps = {
    result: Result<AreaMetadata[], string>;
    value: AreaMetadata | null;
    onChange: (event: React.SyntheticEvent<Element, Event>, value: AreaMetadata | null) => void;
}

function AreaAutoComplete({result, value, onChange}: AreaAutoCompleteProps) {
    return (
        <Autocomplete
            isOptionEqualToValue={(option: AreaMetadata, value: AreaMetadata) => option.calendar_name === value.calendar_name }
            id="autocomplete-areas"
            groupBy={(option) => prettifyName(option.province)}
            loading={["unsent", "loading"].includes(result.state)}
            blurOnSelect={true}
            options={result.state === "ready" ? result.content : []}
            noOptionsText={"No areas"}
            value={value}
            disabledItemsFocusable={true}
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
                                ? "Failed to get the loadshedding schedules"
                                : "See the loadshedding schedule for..."
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
            renderOption={(props, option, state) => <AreaAutoCompleteOption state={state} props={props} option={option}/>}
            getOptionLabel={option => `${prettifyName(option.calendar_name)} (${option.calendar_name.replace(".ics", "")})`}
            onChange={onChange}
        />
    )
}

export default AreaAutoComplete
