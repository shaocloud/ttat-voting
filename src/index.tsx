
import { render } from 'preact';
import './style.css';
import { Interface } from './components/Interface';
import { AdminPage } from './pages/AdminPage';
import { DisplayPage } from './pages/DisplayPage';
import { ADMIN_PATH, DISPLAY_PATH } from './config';

export function App() {
	// hosting rewrites every path to index.html, so a pathname switch is enough
	const path = location.pathname.replace(/^\/+|\/+$/g, '');
	if (path === ADMIN_PATH) return <AdminPage/>;
	if (path === DISPLAY_PATH) return <DisplayPage/>;

	return (
		<div 
			 className="bg-[url('/assets/worn-paper.jpg')] 
			 			min-h-screen 
						w-full
						bg-cover bg-center">
			<Interface/>
		</div>
	);
}

function Resource(props) {
	return (
		<a href={props.href} target="_blank" class="resource">
			<h2>{props.title}</h2>
			<p>{props.description}</p>
		</a>
	);
}

render(<App />, document.getElementById('app'));
