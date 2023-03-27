import * as React from "react"
import {createTheme, responsiveFontSizes} from "@mui/material"
import {Navigate, Route, Routes} from "react-router"
import Home from "./Home"
import About from "./About"
import MakePullRequest from "./MakePullRequest"
import EskomCalendar from "./EskomCalendar"
import NotFound from "./NotFound"
import {ThemeProvider} from "@emotion/react"

function App() {
    let theme = createTheme({
        palette: {
            background: {
                default: "#26251F",
                paper: "#26251F",
            },
            text: {
                primary: "#ECC11F",
                secondary: "#F5EABA",
            },
        },
    })
    theme = responsiveFontSizes(theme)

    return (<>
        <ThemeProvider theme={theme}>
            <Routes>
                <Route path="/" element={ <Navigate to="/ec" /> } />
                <Route path="/home" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/ec" element={<EskomCalendar />} />
                <Route path="/ec/pr" element={<MakePullRequest />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </ThemeProvider>
    </>)
}

export default App
