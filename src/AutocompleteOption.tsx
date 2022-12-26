import {Box} from "@mui/material"
import * as React from "react"
import {ReleaseAsset} from "./FindCalendar2"

type AutocompleteOptionProps = {
    props: object,
    option: ReleaseAsset,
    state: object
};

function AutocompleteOption({props, state, option}: AutocompleteOptionProps) {
    return (
        <Box key={option.id} component="li" sx={{ "& > img": { mr: 2, flexShrink: 0 } }} {...props}>
            {option.name.replaceAll("-", " ").replace(".ics", "")}
        </Box>
    )
}

export default AutocompleteOption
