import * as React from "react"
import {Autocomplete, CircularProgress, TextField} from "@mui/material"
import {prettifyName, ReleaseAsset, Result} from "./EskomCalendar"
import AutocompleteOption from "./AutocompleteOption"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"


type AssetAutoCompleteProps = {
    result: Result<ReleaseAsset[], string>;
    value: ReleaseAsset | null;
    onChange: (event: React.SyntheticEvent<Element, Event>, value: ReleaseAsset | null) => void;
}

function AssetAutoComplete({result, value, onChange}: AssetAutoCompleteProps) {
    return (
        <Autocomplete
            isOptionEqualToValue={(option: ReleaseAsset, value: ReleaseAsset) => option.label === value.label }
            id="autocomplete-assets"
            loading={["unsent", "loading"].includes(result.state)}
            blurOnSelect={true}
            options={result.state === "ready" ? result.content : []}
            noOptionsText={"No areas"}
            value={value}
            disabledItemsFocusable={true}
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
            renderOption={(props, option, state) => <AutocompleteOption state={state} props={props} option={option}/>}
            getOptionLabel={option => prettifyName(option.name)}
            onChange={onChange}
        />
    )
}

export default AssetAutoComplete
