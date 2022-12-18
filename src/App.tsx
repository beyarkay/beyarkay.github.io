import './App.css';
import * as React from 'react';
import Container from '@mui/material/Container';
import FindCalendar from './FindCalendar';
import Header from './Header';
import MakePullRequest from './MakePullRequest';
import {Link} from '@mui/material';

type View = 'findCalendar' | 'makePullRequest';

function App() {
    const [view, setView] = React.useState<View>('makePullRequest');

    const setViewOnClick = () => setView(
        view === 'findCalendar' ? 'makePullRequest' : 'findCalendar'
    )

    return (<>
        <Container maxWidth="lg">
            <Header/>
            <Link onClick={setViewOnClick}>
                { view === 'findCalendar' ? 'make pull request' : ' find your calendar' }
            </Link>
            { view === 'findCalendar' ? <FindCalendar/> : <MakePullRequest/>}
        </Container>
    </>);
}

export default App;
