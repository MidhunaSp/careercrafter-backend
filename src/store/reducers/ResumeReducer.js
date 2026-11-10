import { FETCH_RESUMES, CLEAR_RESUMES } from "../actions/ResumeAction"

const initialState = {
    resumes: []
}

const ResumeReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_RESUMES:
            return { ...state, resumes: action.payload }
        case CLEAR_RESUMES:
            return initialState
        default:
            return state
    }
}

export default ResumeReducer