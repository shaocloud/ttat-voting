
import { render } from 'preact';
import { VoteGrid } from './components/VoteGrid';
import './style.css';

export function App() {
	return (
		<div 
			 className="bg-[url('/assets/worn-paper.jpg')] 
			 			min-h-screen 
						min-w-screen
						bg-cover bg-center">
			<VoteGrid/>
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
