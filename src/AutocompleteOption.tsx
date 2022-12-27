import {Box} from "@mui/material"
import * as React from "react"
import { ReleaseAsset, prettifyName} from "./EskomCalendar"
type AutocompleteOptionProps = {
    props: object,
    option: ReleaseAsset,
    state: object
};

function AutocompleteOption({props, option}: AutocompleteOptionProps) {
    return (
        <Box key={option.id} component="li" sx={{ "& > img": { mr: 2, flexShrink: 0 } }} {...props}>
            {prettifyName(option.name)}
        </Box>
    )
}

export default AutocompleteOption
