import "./App.css"
import * as React from "react"
import {createTheme} from "@mui/material"
import {Navigate, Route, Routes} from "react-router"
import Home from "./Home"
import About from "./About"
import MakePullRequest from "./MakePullRequest"
import EskomCalendar from "./EskomCalendar"
import NotFound from "./NotFound"
import {ThemeProvider} from "@emotion/react"

function App() {
    const theme = createTheme({
        palette: {
            background: {
                default: "#26251F",
                paper: "#F5EABA",
            },
            text: {
                primary: "#ECC11F",
                secondary: "#F5EABA",
            },
        },
    })

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
