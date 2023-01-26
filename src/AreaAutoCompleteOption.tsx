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
    const normed_input = state.inputValue.replaceAll("-", " ").toLowerCase()
    const includesInputValue = (a: Area) => {
        if (Array.isArray(a.name)) {
            // If name is a list of names, check every one of them
            return a.name.map(n => n.replaceAll("-", " ")).filter(n => n.includes(normed_input)).length > 0
        } else {
            // otherwise, just check the single name
            return a.name.replaceAll("-", " ").includes(normed_input)
        }
    }
    const area_names = option.areas
        .filter(area => includesInputValue(area))
        .map(area => {
            if (Array.isArray(area.name)) {
                return area.name.filter(a => a.replaceAll("-", " ").toLowerCase().includes(normed_input))
            } else {
                return area.name
            }
        })
        // .sort((a, b) => includesInputValue(a) === includesInputValue(b) ? a.name.localeCompare(b.name) : (includesInputValue(a) ? -1 : 1))
        .map(a => {
            if (Array.isArray(a)) {
                return a.map(n => prettifyName(n)).join(", ")
            } else {
                return prettifyName(a)
            }
        })
        .join(", ")
    console.log("Area names:", area_names)
    console.log("normed_input:", normed_input)
    const matches = match(area_names, normed_input, { insideWords: true })
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
