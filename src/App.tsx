import "./App.css"
import * as React from "react"
import Container from "@mui/material/Container"
import FindCalendar from "./FindCalendar"
import Header from "./Header"
import MakePullRequest from "./MakePullRequest"
import {Link, Typography} from "@mui/material"

type View = "findCalendar" | "makePullRequest";

function App() {
    const [view, setView] = React.useState<View>("findCalendar")

    const setViewOnClick = () => setView(
        view === "findCalendar" ? "makePullRequest" : "findCalendar"
    )

    return (<>
        <Header />
        <Typography variant="subtitle2" align="center">
            <Link onClick={setViewOnClick}>
                {view === "findCalendar" ? "make pull request" : " find your calendar"}
            </Link>
        </Typography>
        {view === "findCalendar" ? <FindCalendar /> : <MakePullRequest />}
    </>)
}

export default App
