import React, { JSX } from 'react';
import Autosuggest from 'react-autosuggest';
import AutosuggestHighlightMatch from "autosuggest-highlight/match";
import AutosuggestHighlightParse from "autosuggest-highlight/parse";
import { isMobile } from 'react-device-detect'

import { debounce, escapeRegexCharacters } from 'common/utilities'

import './AutoSuggestAnswers.css'
import { IDBPCursorWithValue, IDBPCursorWithValueIteratorValue, IDBPDatabase } from 'idb';
import { IAnswer } from 'groups/types';

interface IAnswerShort {
	id: number;
	parentGroup: string;
	title: string;
}

interface IGroupShort {
	id: string,
	parentGroupUp: string,
	groupParentTitle: string,
	groupTitle: string,
	answers: IAnswerShort[]
}

interface IAnswerRow {
	groupId: string,
	groupTitle: string,
	parentGroupUp: string,
	groupParentTitle: string, // TODO ???
	id: number,
	parentGroup: string,
	title: string
}

interface IAnswerRowShort {
	groupId: string,
	groupTitle: string,
	parentGroupUp: string,
	groupParentTitle: string, // TODO ???
	answers: IAnswerShort[]
}


// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expression
// s#Using_Special_Characters
// export function escapeRegexCharacters(str: string): string {
// 	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// }

// autoFocus does the job
//let inputAutosuggest = createRef<HTMLInputElement>();

const AnswerAutosuggestMulti = Autosuggest as { new(): Autosuggest<IAnswerShort, IGroupShort> };


export class AutoSuggestAnswers extends React.Component<{
	dbp: IDBPDatabase,
	tekst: string | undefined,
	alreadyAssigned: number[],
	onSelectQuestionAnswer: (groupId: string, answerId: number) => void
}, any
> {
	// region Fields
	state: any;
	isMob: boolean;
	dbp: IDBPDatabase;
	alreadyAssigned: number[];
	debouncedLoadSuggestions: (value: string) => void;
	//inputAutosuggest: React.RefObject<HTMLInputElement>;
	// endregion region Constructor
	constructor(props: any) {
		super(props);
		this.state = {
			value: props.tekst || '',
			suggestions: this.getSuggestions(''),
			noSuggestions: false,
			highlighted: '',
			isLoading: false
		};
		//this.inputAutosuggest = createRef<HTMLInputElement>();
		this.dbp = props.dbp;
		this.alreadyAssigned = props.alreadyAssigned;
		this.isMob = isMobile;

		this.loadSuggestions = this.loadSuggestions.bind(this);
		this.debouncedLoadSuggestions = debounce(this.loadSuggestions, 300);
	}

	async loadSuggestions(value: string) {
		this.setState({
			isLoading: true
		});

		const suggestions = await this.getSuggestions(value);

		if (value === this.state.value) {
			this.setState({
				isLoading: false,
				suggestions,
				noSuggestions: suggestions.length === 0
			});
		}
		else { // Ignore suggestions if input value changed
			this.setState({
				isLoading: false
			});
		}
	}

	// componentDidMount() {
	// 	setTimeout(() => {
	// 		window.focus()
	// 		// inputAutosuggest!.current!.focus();
	// 	}, 500)
	// }


	// endregion region Rendering methods
	render(): JSX.Element {
		const { value, suggestions, noSuggestions, isLoading } = this.state;
		const status = (isLoading ? 'Loading...' : 'Type to load suggestions');

		return <div>
			<div className="status">
				<strong>Status:</strong> {status}
			</div>
			<AnswerAutosuggestMulti
				onSuggestionsClearRequested={this.onSuggestionsClearRequested}  // (sl) added
				multiSection={true}
				suggestions={suggestions}
				onSuggestionsFetchRequested={this.onSuggestionsFetchRequested.bind(this)}
				onSuggestionSelected={this.onSuggestionSelected.bind(this)}
				getSuggestionValue={this.getSuggestionValue}
				renderSuggestion={this.renderSuggestion}
				renderSectionTitle={this.renderSectionTitle}
				getSectionSuggestions={this.getSectionSuggestions}
				// onSuggestionHighlighted={this.onSuggestionHighlighted} (sl)
				onSuggestionHighlighted={this.onSuggestionHighlighted.bind(this)}
				highlightFirstSuggestion={false}
				renderInputComponent={this.renderInputComponent}
				renderSuggestionsContainer={this.renderSuggestionsContainer}
				focusInputOnSuggestionClick={!this.isMob}
				inputProps={{
					placeholder: `Type 'work' or 'bater'`,
					value,
					onChange: (e, changeEvent) => this.onChange(e, changeEvent),
					autoFocus: true
				}}
			/>
			{noSuggestions &&
				<div className="no-suggestions">
					No answers to suggest
				</div>
			}
		</div>
	}

	protected onSuggestionsClearRequested = () => {
		this.setState({
			suggestions: [],
			noSuggestions: false
		});
	};

	protected onSuggestionSelected(event: React.FormEvent<any>, data: Autosuggest.SuggestionSelectedEventData<IAnswerShort>): void {
		const answer: IAnswerShort = data.suggestion;
		// alert(`Selected answer is ${answer.answerId} (${answer.text}).`);
		this.props.onSelectQuestionAnswer(answer.parentGroup, answer.id);
	}

	/*
	protected renderSuggestion(suggestion: Answer, params: Autosuggest.RenderSuggestionParams): JSX.Element {
		 const className = params.isHighlighted ? "highlighted" : undefined;
		 return <span className={className}>{suggestion.name}</span>;
	}
	*/

	protected renderSuggestion(suggestion: IAnswerShort, params: Autosuggest.RenderSuggestionParams): JSX.Element {
		// const className = params.isHighlighted ? "highlighted" : undefined;
		//return <span className={className}>{suggestion.name}</span>;
		const matches = AutosuggestHighlightMatch(suggestion.title, params.query);
		const parts = AutosuggestHighlightParse(suggestion.title, matches);
		return (
			<span style={{ textAlign: 'left' }}>
				{parts.map((part, index) => {
					const className = part.highlight ? 'react-autosuggest__suggestion-match' : undefined;
					return (
						<span className={className} key={index}>
							{part.text}
						</span>
					);
				})}
			</span>
		);
	}

	protected renderSectionTitle(section: IGroupShort): JSX.Element {
		const { parentGroupUp, groupParentTitle, groupTitle } = section;
		let str = (groupParentTitle ? (groupParentTitle + " / ") : "") + groupTitle;
		if (parentGroupUp)
			str = " ... / " + str;
		return <strong>
			{str}
		</strong>;
	}

	// protected renderInputComponent(inputProps: Autosuggest.InputProps<IAnswerShort>): JSX.Element {
	// 	 const { onChange, onBlur, ...restInputProps } = inputProps;
	// 	 return (
	// 		  <div>
	// 				<input {...restInputProps} />
	// 		  </div>
	// 	 );
	// }

	protected renderInputComponent(inputProps: Autosuggest.RenderInputComponentProps): JSX.Element {
		const { ref, ...restInputProps } = inputProps;
		// if (ref !== undefined)
		// 	this.inputAutosuggest = ref as React.RefObject<HTMLInputElement>;

		return (
			<div>
				{/* <input {...restInputProps} ref={inputAutosuggest} /> */}
				<input ref={ref} autoFocus {...restInputProps} />
			</div>
		);
	}

	// const Input = forwardRef<HTMLInputElement, Omit<InputProps, "ref">>(
	// 	(props: Omit<InputProps, "ref">, ref): JSX.Element => (
	// 	  <input {...props} ref={ref} />
	// 	)
	//   );


	protected renderSuggestionsContainer({ containerProps, children, query }:
		Autosuggest.RenderSuggestionsContainerParams): JSX.Element {
		return (
			<div {...containerProps}>
				<span>{children}</span>
			</div>
		);
	}
	// endregion region Event handlers

	protected onChange(event: /*React.ChangeEvent<HTMLInputElement>*/ React.FormEvent<any>, { newValue, method }: Autosuggest.ChangeEvent): void {
		this.setState({ value: newValue });
	}


	// getParentTitle = async (id: string): Promise<any> => {
	// 	let group = await this.dbp.get('Groups', id);
	// 	return { parentGroupTitle: group.title, parentGroupUp: '' };
	// }

	protected /*async*/ onSuggestionsFetchRequested({ value }: any): void { //Promise<void> {
		return /*await*/ this.debouncedLoadSuggestions(value);
	}

	private anyWord = (valueWordRegex: RegExp[], answerWords: string[]): boolean => {
		for (let valWordRegex of valueWordRegex)
			for (let answerWord of answerWords)
				if (valWordRegex.test(answerWord))
					return true;
		return false;
	}

	// endregion region Helper methods
	protected async getSuggestions(value: string): Promise<IAnswerRowShort[]> {
		const escapedValue = escapeRegexCharacters(value.trim());
		if (escapedValue === '') {
			return [];
		}
		//return [];
		if (!this.dbp || value.length < 2)
			return [];
		const tx = this.dbp!.transaction(['Groups', 'Answers'], 'readonly');
		const index = tx.objectStore('Answers').index('words_idx');
		const answerRows: IAnswerRow[] = [];
		//const mapParentGroupTitle = new Map<string, string>();
		try {
			//const search = encodeURIComponent(value.trim().replaceAll('?', ''));
			const searchWords = value.toLowerCase().replaceAll('?', '').split(' ').map((s: string) => s.trim());
			let i = 0;
			while (i < searchWords.length) {
				// let cursor: IDBPCursorWithValue<unknown, string[], "Answers", "words_idx", "readwrite">|null = 
				// 		await index.openCursor(word);
				// while (cursor) {
				// 	console.log(cursor.key, cursor.value);
				// for await (const cursor of index.iterate(searchWords[i])) {
				const w = searchWords[i];
				for await (const cursor of index.iterate(IDBKeyRange.bound(w, `${w}zzzzz`, false, true))) {
					const q: IAnswer = { ...cursor!.value, id: parseInt(cursor!.primaryKey.toString()) }
					if (this.props.alreadyAssigned.includes(q.id!)) {
						continue;
					}
					const row: IAnswerRow = {
						id: q.id!,
						groupId: q.parentGroup,
						groupTitle: '',
						groupParentTitle: '',
						parentGroupUp: '',
						title: q.title,
						parentGroup: q.parentGroup
					}
					if (!answerRows.find(({ id }) => id === q.id))
						answerRows.push(row);
					//cursor = await cursor.continue();
				}
				i++;
			}
		}
		catch (error: any) {
			console.debug(error)
		};

		if (answerRows.length === 0)
			return [];

		try {
			const groupsStore = tx.objectStore('Groups')
			const mapParentGroupTitle = new Map<string, string>();
			let i = 0;
			while (i < answerRows.length) {
				const row = answerRows[i];
				if (!mapParentGroupTitle.has(row.parentGroup)) {
					const group = await groupsStore.get(row.parentGroup);
					mapParentGroupTitle.set(group.id, group.title)
				}
				i++;
			}

			const map = new Map<string, IAnswerRow[]>();
			i = 0;
			while (i < answerRows.length) {
				const row = answerRows[i];
				row.groupTitle = mapParentGroupTitle.get(row.groupId)!;
				if (!map.has(row.groupId)) {
					map.set(row.groupId, [row]);
				}
				else {
					map.get(row.groupId)!.push(row);
				}
				i++;
			};
			//console.log('map', map)

			let values = map.values();
			let data: IAnswerRowShort[] = [];
			while (true) {
				let result = values.next();
				if (result.done) break;
				const rows = result.value as unknown as IAnswerRow[];
				const answerRowShort: IAnswerRowShort = {
					groupId: '',
					groupTitle: '',
					groupParentTitle: '',
					parentGroupUp: '',
					answers: []
				};
				i = 0;
				while (i < rows.length) {
					const row = rows[i];
					// console.log(row);
					const { id, title, groupId, groupTitle, parentGroup, parentGroupUp } = row;
					let groupParentTitle = '';

					let group = await groupsStore.get(groupId);
					while (group.parentGroup !== 'null') {
						group = await groupsStore.get(group.parentGroup);
						groupParentTitle += ' / ' + group.title;
					}

					if (answerRowShort.groupId === '') {
						answerRowShort.groupId = groupId;
						answerRowShort.groupTitle = groupTitle;
						answerRowShort.groupParentTitle = groupParentTitle;
						answerRowShort.parentGroupUp = parentGroupUp;
					}
					answerRowShort.answers.push({ id, title, parentGroup } as IAnswerShort)
					i++;
				};
				data.push(answerRowShort);
			}
			await tx.done;
			console.log(data)
			return data;
			//this.setState({ suggestions: data, noSuggestions: data.length === 0 })
		}
		catch (error: any) {
			console.log(error)
		};
		return [];
	}

	protected getSuggestionValue(suggestion: IAnswerShort) {
		return suggestion.title;
	}

	protected getSectionSuggestions(section: IGroupShort) {
		return section.answers;
	}

	protected onSuggestionHighlighted(params: Autosuggest.SuggestionHighlightedParams): void {
		this.setState({
			highlighted: params.suggestion
		});
	}
	// endregion
}