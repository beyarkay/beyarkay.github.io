import * as React from "react"
import {Autocomplete, TextField} from "@mui/material"
import {prettifyName, ReleaseAsset, Result} from "./EskomCalendar"
import AutocompleteOption from "./AutocompleteOption"


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
            value={value}
            renderInput={(params) => {
                return (
                    <TextField  {...params}
                        variant="standard" 
                        sx={{color: "#000"}}
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
