import "./App.css"
import * as React from "react"
import MakePullRequest from "./MakePullRequest"
import {Navigate, Route, Routes} from "react-router"
import Home from "./Home"
import About from "./About"
import NotFound from "./NotFound"
import EskomCalendar from "./EskomCalendar"

function App() {
    return (<>
        <Routes>
            <Route path="/" element={ <Navigate to="/ec" /> } />
            <Route path="/home" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/ec" element={<EskomCalendar />} />
            <Route path="/ec/pr" element={<MakePullRequest />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    </>)
}

export default App
