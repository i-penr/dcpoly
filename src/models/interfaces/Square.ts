export default interface Square {
	id: number;
	name: string;
	type:
		| 'property'
		| 'station'
		| 'card'
		| 'special'
		| 'start'
		| 'jail'
		| 'visit_jail'
		| 'free_space'
		| 'tax';
	cost?: number;
}
