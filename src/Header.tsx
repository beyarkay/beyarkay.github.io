import * as React from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import {Stack, SvgIcon} from "@mui/material"

function Header() {
    return (<>
        <Box
            sx={{
                backgroundColor: "primary.dark",
            }}
        >
            <HomeIcon/>
        </Box>
        <Typography variant="subtitle1" align="center">
            Eskom loadshedding schedules in your digital calendar
        </Typography>
    </>)
}

function HomeIcon() {
    const circProps: React.CSSProperties = {
        fill:"#fff753",
        stroke:"none",
        strokeWidth:"0",
        strokeOpacity:"0.668394",
        fillOpacity:"0.44368598",
        strokeDasharray:"none",
    }
    const rectProps: React.CSSProperties = {
        fill: "#000000",
        fillOpacity: "1",
        stroke: "#000000",
        strokeWidth: "0.264583",
        strokeOpacity: "0.668394",
    }
    return (
        <div style={{position: "relative", width: "100%", height: "100px"}}>
            <SvgIcon
                style={{position: "relative", left: 0, top: 0, width: "100%", height: "100%"}}
                viewBox={""}
            >
                <rect
                    style={rectProps}
                    width="100%"
                    height="100%"
                    x="0"
                    y="0" />
                <circle
                    style={circProps}
                    cx="0"
                    cy="100%"
                    r="30%"
                />
                <circle
                    style={circProps}
                    cx="0"
                    cy="100%"
                    r="60%"
                />
                <circle
                    style={circProps}
                    cx="0"
                    cy="100%"
                    r="90%"
                />
                <circle
                    style={circProps}
                    cx="0"
                    cy="100%"
                    r="120%"
                />
                <text
                    x="50%"
                    y="60%"
                    textAnchor="middle"
                    fontSize={"1.5em"}
                >
                    eskom-calendar
                </text>
            </SvgIcon>
        </div>
    )
}

export default Header

