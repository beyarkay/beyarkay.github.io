import {Box, Typography} from "@mui/material"
import * as React from "react"
import { ReleaseAsset, prettifyName} from "./EskomCalendar"
type AutocompleteOptionProps = {
    props: object,
    option: ReleaseAsset,
    state: object
};

function AutocompleteOption({props, option}: AutocompleteOptionProps) {
    return (
        <Box
            key={option.id}
            component="li"
            {...props}
        >
            <Typography
                align="center"
                fontSize={20}
                fontFamily={"Overpass"}
            >
                {prettifyName(option.name)}
            </Typography>
        </Box>
    )
}

export default AutocompleteOption
