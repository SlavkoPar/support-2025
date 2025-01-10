import React, { JSX } from 'react';
import Autosuggest from 'react-autosuggest';
import AutosuggestHighlightMatch from "autosuggest-highlight/match";
import AutosuggestHighlightParse from "autosuggest-highlight/parse";
import { isMobile } from 'react-device-detect'

import './AutoSuggestQuestions.css'
import { IDBPCursorWithValue, IDBPCursorWithValueIteratorValue, IDBPDatabase } from 'idb';
import { IQuestion } from './types';

interface IQuestionShort {
	id: number;
	parentCategory: string;
	title: string;
}

interface ICategoryShort {
	id: string,
	parentCategoryUp: string,
	categoryParentTitle: string,
	categoryTitle: string,
	questions: IQuestionShort[]
}

interface IQuestionRow {
	categoryId: string,
	categoryTitle: string,
	parentCategoryUp: string,
	categoryParentTitle: string, // TODO ???
	id: number,
	parentCategory: string,
	title: string
}

interface IQuestionRowShort {
	categoryId: string,
	categoryTitle: string,
	parentCategoryUp: string,
	categoryParentTitle: string, // TODO ???
	questions: IQuestionShort[]
}


// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expression
// s#Using_Special_Characters
function escapeRegexCharacters(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// autoFocus does the job
//let inputAutosuggest = createRef<HTMLInputElement>();

const QuestionAutosuggestMulti = Autosuggest as { new(): Autosuggest<IQuestionShort, ICategoryShort> };

export class AutoSuggestQuestions extends React.Component<{
	dbp: IDBPDatabase,
	wsId: string,
	tekst: string | undefined,
	onSelectQuestion: (categoryId: string, questionId: number) => void
}, any
> {
	// region Fields
	state: any;
	isMob: boolean;
	wsId: string;
	dbp: IDBPDatabase;
	//inputAutosuggest: React.RefObject<HTMLInputElement>;
	// endregion region Constructor
	constructor(props: any) {
		super(props);
		this.state = {
			value: props.tekst || '',
			suggestions: this.getSuggestions(''),
			noSuggestions: false,
			highlighted: ''
		};
		//this.inputAutosuggest = createRef<HTMLInputElement>();
		this.dbp = props.dbp;
		this.isMob = isMobile;
		this.wsId = props.wsId;
	}

	componentDidMount() {
		setTimeout(() => {
			window.focus()
			// inputAutosuggest!.current!.focus();
		}, 500)
	}

	// endregion region Rendering methods
	render(): JSX.Element {
		const { value, suggestions, noSuggestions } = this.state;

		return <div>
			<QuestionAutosuggestMulti
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
					placeholder: `Type 'extension'`,
					value,
					onChange: (e, changeEvent) => this.onChange(e, changeEvent),
					autoFocus: true
				}}
			/>
			{noSuggestions &&
				<div className="no-suggestions">
					No questions to suggest
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

	protected onSuggestionSelected(event: React.FormEvent<any>, data: Autosuggest.SuggestionSelectedEventData<IQuestionShort>): void {
		const question: IQuestionShort = data.suggestion;
		// alert(`Selected question is ${question.questionId} (${question.text}).`);
		this.props.onSelectQuestion(question.parentCategory, question.id);
	}

	/*
	protected renderSuggestion(suggestion: Question, params: Autosuggest.RenderSuggestionParams): JSX.Element {
		 const className = params.isHighlighted ? "highlighted" : undefined;
		 return <span className={className}>{suggestion.name}</span>;
	}
	*/

	protected renderSuggestion(suggestion: IQuestionShort, params: Autosuggest.RenderSuggestionParams): JSX.Element {
		// const className = params.isHighlighted ? "highlighted" : undefined;
		//return <span className={className}>{suggestion.name}</span>;
		const matches = AutosuggestHighlightMatch(suggestion.title, params.query);
		const parts = AutosuggestHighlightParse(suggestion.title, matches);
		return (
			<span>
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


	protected renderSectionTitle(section: ICategoryShort): JSX.Element {
		const { parentCategoryUp, categoryParentTitle, categoryTitle } = section;
		let str = (categoryParentTitle ? (categoryParentTitle + " / ") : "") + categoryTitle;
		if (parentCategoryUp)
			str = " ... / " + str;
		return <strong>
			{str}
		</strong>;
	}

	// protected renderInputComponent(inputProps: Autosuggest.InputProps<IQuestionShort>): JSX.Element {
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
	// 	let category = await this.dbp.get('Categories', id);
	// 	return { parentCategoryTitle: category.title, parentCategoryUp: '' };
	// }

	protected async onSuggestionsFetchRequested({ value }: any): Promise<void> {
		if (!this.dbp || value.length < 2)
			return;

		const tx = this.dbp!.transaction(['Categories', 'Questions'], 'readwrite');
		const index = tx.objectStore('Questions').index('words_idx');
		const questionRows: IQuestionRow[] = [];
		//const mapParentCategoryTitle = new Map<string, string>();

		try {
			//const search = encodeURIComponent(value.trim().replaceAll('?', ''));
			const searchWords: string[] = value.trim().toLowerCase().replaceAll('?', '').split(' ');
			let i = 0;
			//searchWords.forEach(async word => {
			while (i < searchWords.length) {
				// let cursor: IDBPCursorWithValue<unknown, string[], "Questions", "words_idx", "readwrite">|null = 
				// 		await index.openCursor(word);
				// while (cursor) {
				// 	console.log(cursor.key, cursor.value);
				for await (const cursor of index.iterate(searchWords[i])) {
					const q: IQuestion = { ...cursor!.value, id: parseInt(cursor!.primaryKey.toString()) }
					const row: IQuestionRow = {
						id: q.id!,
						categoryId: q.parentCategory,
						categoryTitle: '',
						categoryParentTitle: '',
						parentCategoryUp: '',
						title: q.title,
						parentCategory: q.parentCategory
					}
					if (!questionRows.find(({ id }) => id === q.id))
						questionRows.push(row);
					//cursor = await cursor.continue();
				}
				i++;
			}
		}
		catch (error: any) {
			console.debug(error)
		};

		if (questionRows.length === 0)
			return;

		try {
			const categoriesStore = tx.objectStore('Categories')
			const mapParentCategoryTitle = new Map<string, string>();
			questionRows.forEach(async (row) => {
				if (!mapParentCategoryTitle.has(row.parentCategory)) {
					const category = await categoriesStore.get(row.parentCategory);
					mapParentCategoryTitle.set(category.id, category.title)
				}
			})

			const map = new Map<string, IQuestionRow[]>();
			questionRows.forEach(async (row) => {
				row.categoryTitle = mapParentCategoryTitle.get(row.categoryId)!;
				if (!map.has(row.categoryId)) {
					map.set(row.categoryId, [row]);
				}
				else {
					map.get(row.categoryId)!.push(row);
				}
			});
			console.log('map', map)

			let values = map.values();
			let data: IQuestionRowShort[] = [];
			while (true) {
				let result = values.next();
				if (result.done) break;
				const rows = result.value as unknown as IQuestionRow[];
				const questionRowShort: IQuestionRowShort = {
					categoryId: '',
					categoryTitle: '',
					categoryParentTitle: '',
					parentCategoryUp: '',
					questions: []
				};
				rows.forEach(async row => {
					console.log(row);
					const { id, title, categoryId, categoryTitle, parentCategory, parentCategoryUp } = row;
					let categoryParentTitle = '';

					let category = await categoriesStore.get(categoryId);
					while (category.parentCategory !== 'null') {
						category = await categoriesStore.get(category.parentCategory);
						categoryParentTitle += '/' + category.title;
					}

					if (questionRowShort.categoryId === '') {
						questionRowShort.categoryId = categoryId;
						questionRowShort.categoryTitle = categoryTitle;
						questionRowShort.categoryParentTitle = categoryParentTitle;
						questionRowShort.parentCategoryUp = parentCategoryUp;
					}
					questionRowShort.questions.push({ id, title, parentCategory } as IQuestionShort)
				});
				data.push(questionRowShort);
			}
			await tx.done;
			console.log(data)
			this.setState({ suggestions: data, noSuggestions: data.length === 0 })
		}
		catch (error: any) {
			console.log(error)
		};

		//questions.push({ ...cursor.value, id: cursor.key })
		/*
		const z = {
			"_id": "645250c80081ac3894275619",
			"parentCategoryUp": "",
			"categoryParentTitle": "Featuressss",
			"categoryTitle": "Taxes",
			"questions": [
				{
					"_id": "645250c80081ac3894275625",
					"title": "Does Chrome support Manifest 3 Extensions?\n",
					"parentCategory": "645250c80081ac3894275619"
				}
			]
		}
		*/
	}

	// axios
	// 	.get(`/api/questions/get-questions/${this.wsId}/${search}`)
	// 	.then(({ data }) => {
	// 		console.log('samo stampaj sta dolazi:', { data })
	// 		this.setState({
	// 			suggestions: data,
	// 			noSuggestions: data.length === 0
	// 		})

	// 		this.setState({ suggestions: data })
	// 		//dispatch({ type, payload: { question } });
	// 	})
	// 	.catch((error) => {
	// 		console.log(error);
	// 		//dispatch({ type: ActionTypes.SET_ERROR, payload: error });
	// 	});


	private anyWord = (valueWordRegex: RegExp[], questionWords: string[]): boolean => {
		for (let valWordRegex of valueWordRegex)
			for (let questionWord of questionWords)
				if (valWordRegex.test(questionWord))
					return true;
		return false;
	}
	// endregion region Helper methods
	protected getSuggestions(value: string): ICategoryShort[] {
		const escapedValue = escapeRegexCharacters(value.trim());

		if (escapedValue === '') {
			return [];
		}
		return [];
	}

	protected getSuggestionValue(suggestion: IQuestionShort) {
		return suggestion.title;
	}

	protected getSectionSuggestions(section: ICategoryShort) {
		return section.questions;
	}

	protected onSuggestionHighlighted(params: Autosuggest.SuggestionHighlightedParams): void {
		this.setState({
			highlighted: params.suggestion
		});
	}
	// endregion
}