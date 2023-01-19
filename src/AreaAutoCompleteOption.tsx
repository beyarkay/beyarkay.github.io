import {Box, Typography} from "@mui/material"
import {Stack} from "@mui/system"
import match from "autosuggest-highlight/match"
import parse from "autosuggest-highlight/parse"
import * as React from "react"
import {Area, AreaMetadata, prettifyName} from "./EskomCalendar"

type AreaAutoCompleteOptionProps = {
    props: object,
    option: AreaMetadata,
    state: {inputValue: string}
};

function AreaAutoCompleteOption({props, option, state}: AreaAutoCompleteOptionProps) {
    const includesInputValue = (a: Area) => {
        return a.name.replaceAll("-", " ").includes(state.inputValue.toLowerCase())
    }
    const area_names = option.areas
        .sort((a, b) => includesInputValue(a) === includesInputValue(b) ? a.name.localeCompare(b.name) : (includesInputValue(a) ? -1 : 1))
        .map(a => prettifyName(a.name))
        .join(", ")
    const matches = match(area_names, state.inputValue, { insideWords: true })
    const parts = parse(area_names, matches)

    return (
        <Box
            key={option.calendar_name}
            component="li"
            width={"100%"}
            {...props}
        >
            <Stack width={"100%"} >
                <Stack width={"100%"} justifyContent="space-between" direction={"row"}>
                    <Typography
                        align="left"
                        fontSize={20}
                        fontFamily={"Overpass"}
                    >
                        {prettifyName(option.calendar_name)}
                    </Typography>
                    <Typography
                        align="right"
                        fontSize={15}
                        fontFamily={"Overpass"}
                    >
                        {`(${option.calendar_name})`}
                    </Typography>
                </Stack>
                <div>
                    {parts.map((part, index) => (
                        <span key={index} style={{ fontWeight: part.highlight ? 900 : 300, }} >
                            {part.text}
                        </span>
                    ))}
                </div>
            </Stack>
        </Box>
    )
}

export default AreaAutoCompleteOption
