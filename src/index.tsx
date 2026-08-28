
import { render } from 'preact';
import './style.css';
import { Interface } from './components/Interface';

export function App() {
	return (
		<div 
			 className="bg-[url('/assets/worn-paper.jpg')] 
			 			min-h-screen 
						min-w-screen
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
