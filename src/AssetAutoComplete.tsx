import * as React from "react"
import {Autocomplete, TextField} from "@mui/material"
import {ReleaseAsset, Result} from "./FindCalendar2"
import AutocompleteOption from "./AutocompleteOption"


type AssetAutoCompleteProps = {
    result: Result<ReleaseAsset[], string>;
    onChange: (event: React.SyntheticEvent<Element, Event>, value: ReleaseAsset | null) => void;
}

function AssetAutoComplete({result, onChange}: AssetAutoCompleteProps) {
    return (
        <Autocomplete
            isOptionEqualToValue={(option: ReleaseAsset, value: ReleaseAsset) => option.label === value.label }
            id="autocomplete-assets"
            loading={["unsent", "loading"].includes(result.state)}
            options={result.state === "ready" ? result.content : []}
            renderInput={(params) => <TextField {...params} />}
            renderOption={(props, option, state) => <AutocompleteOption state={state} props={props} option={option}/>}
            getOptionLabel={option => option.name}
            onChange={onChange}
        />
    )
}

export default AssetAutoComplete
