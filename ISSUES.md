# Issues & Notes

## Technical Debt
- **Frontend Styles**: Many styles are hardcoded in Vue components. Should be moved to Tailwind config or CSS files.
- **State Management**: Currently passing data via events/props. Need a global store (Pinia) for Project/Editor state.

## Feature Requests
- **Error Handling**: AI Timeouts need better UI feedback.
- **Project Structure**: Should projects be in a `projects/` subdirectory instead of root?

## Questions
- **Backend**: Current `GenerateSlides` overwrites the file. Should it append?
- **AI**: Need to fine-tune prompts for better Slidev syntax accuracy.
